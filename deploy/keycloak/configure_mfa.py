"""Require an authenticator-app code (TOTP) for admins and deployers in the `runway` realm.

Idempotent; safe to run again. Uses only the standard library.

    KC_URL=https://<keycloak> KC_ADMIN_USER=... KC_ADMIN_PASSWORD=... python configure_mfa.py

What it sets up:
- realm role `mfa-required`, made part of the `admin` and `deployer` roles;
- flow `aiops-browser`: a copy of the built-in browser flow whose second-factor step is
  required for users holding `mfa-required` (instead of only for users who already set one
  up). Users without an authenticator are asked to register one at their next sign-in;
- the realm's browser flow switched to `aiops-browser`.
"""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

REALM = "runway"
ROLE = "mfa-required"
FLOW = "aiops-browser"
MFA_ROLES = ("admin", "deployer")


class Keycloak:
    def __init__(self, base: str, user: str, password: str) -> None:
        self.base = base.rstrip("/")
        form = urllib.parse.urlencode(
            {
                "grant_type": "password",
                "client_id": "admin-cli",
                "username": user,
                "password": password,
            }
        ).encode()
        token = self._send(
            "POST",
            f"{self.base}/realms/master/protocol/openid-connect/token",
            form,
            {"Content-Type": "application/x-www-form-urlencoded"},
        )
        self.headers = {
            "Authorization": f"Bearer {token['access_token']}",
            "Content-Type": "application/json",
        }

    @staticmethod
    def _send(method: str, url: str, data: bytes | None, headers: dict[str, str]) -> Any:
        req = urllib.request.Request(url, data=data, headers=headers, method=method)  # noqa: S310
        with urllib.request.urlopen(req, timeout=60) as resp:  # noqa: S310
            body = resp.read()
        return json.loads(body) if body else None

    def api(self, method: str, path: str, payload: Any = None) -> Any:
        data = json.dumps(payload).encode() if payload is not None else None
        url = f"{self.base}/admin/realms/{REALM}{path}"
        return self._send(method, url, data, self.headers)

    def executions(self, flow_alias: str) -> list[dict[str, Any]]:
        quoted = urllib.parse.quote(flow_alias, safe="")
        result: list[dict[str, Any]] = self.api("GET", f"/authentication/flows/{quoted}/executions")
        return result


def ensure_role(kc: Keycloak) -> None:
    try:
        kc.api("GET", f"/roles/{ROLE}")
    except urllib.error.HTTPError as e:
        if e.code != 404:
            raise
        kc.api(
            "POST",
            "/roles",
            {"name": ROLE, "description": "Must use an authenticator app at sign-in."},
        )
    role = kc.api("GET", f"/roles/{ROLE}")
    for parent in MFA_ROLES:
        composites = kc.api("GET", f"/roles/{parent}/composites")
        if not any(c["name"] == ROLE for c in composites):
            kc.api("POST", f"/roles/{parent}/composites", [role])
    print(f"role {ROLE}: part of {', '.join(MFA_ROLES)}")


def subflow_of(execs: list[dict[str, Any]], target: dict[str, Any]) -> dict[str, Any]:
    """The subflow an execution sits in: the last flow one level up before it (list is depth-first)."""
    parent = None
    for e in execs:
        if e["id"] == target["id"]:
            break
        if e.get("authenticationFlow") and e["level"] == target["level"] - 1:
            parent = e
    if parent is None:
        raise RuntimeError(f"no parent subflow for {target['displayName']}")
    return parent


def children_of(execs: list[dict[str, Any]], flow: dict[str, Any]) -> list[dict[str, Any]]:
    out, inside = [], False
    for e in execs:
        if e["id"] == flow["id"]:
            inside = True
            continue
        if inside:
            if e["level"] <= flow["level"]:
                break
            if e["level"] == flow["level"] + 1:
                out.append(e)
    return out


def put_requirement(
    kc: Keycloak, sub_alias: str, execution: dict[str, Any], requirement: str
) -> None:
    execution = {**execution, "requirement": requirement}
    kc.api(
        "PUT",
        f"/authentication/flows/{urllib.parse.quote(sub_alias, safe='')}/executions",
        execution,
    )


def ensure_flow(kc: Keycloak) -> None:
    # Rebuild from a fresh copy every run: simpler and safer than patching a flow in place.
    kc.api("PUT", "", {"browserFlow": "browser"})
    for f in kc.api("GET", "/authentication/flows"):
        if f["alias"] == FLOW:
            kc.api("DELETE", f"/authentication/flows/{f['id']}")
    kc.api("POST", "/authentication/flows/browser/copy", {"newName": FLOW})

    execs = kc.executions(FLOW)
    otp = next(e for e in execs if e.get("providerId") == "auth-otp-form")
    sub = subflow_of(execs, otp)
    sub_alias = sub["displayName"]

    # Swap the subflow's condition(s) for "user has role mfa-required".
    for c in children_of(execs, sub):
        if c.get("providerId", "").startswith("conditional-"):
            kc.api("DELETE", f"/authentication/executions/{c['id']}")
    kc.api(
        "POST",
        f"/authentication/flows/{urllib.parse.quote(sub_alias, safe='')}/executions/execution",
        {"provider": "conditional-user-role"},
    )
    execs = kc.executions(FLOW)
    cond = next(
        e for e in children_of(execs, sub) if e.get("providerId") == "conditional-user-role"
    )
    put_requirement(kc, sub_alias, cond, "REQUIRED")
    kc.api(
        "POST",
        f"/authentication/executions/{cond['id']}/config",
        {"alias": "aiops-mfa-roles", "config": {"condUserRole": ROLE, "negate": "false"}},
    )
    for _ in range(10):  # the condition must come first in its subflow
        current = next(e for e in kc.executions(FLOW) if e["id"] == cond["id"])
        if current["index"] == 0:
            break
        kc.api("POST", f"/authentication/executions/{cond['id']}/raise-priority")

    # OTP REQUIRED (not ALTERNATIVE), so users without an authenticator must register one.
    otp = next(e for e in kc.executions(FLOW) if e.get("providerId") == "auth-otp-form")
    put_requirement(kc, sub_alias, otp, "REQUIRED")

    kc.api("PUT", "", {"browserFlow": FLOW})
    print(f"flow {FLOW}: OTP required for role {ROLE}; set as the realm's browser flow")


def main() -> None:
    try:
        kc = Keycloak(
            os.environ["KC_URL"], os.environ["KC_ADMIN_USER"], os.environ["KC_ADMIN_PASSWORD"]
        )
    except KeyError as missing:
        sys.exit(f"Set {missing.args[0]}")
    ensure_role(kc)
    ensure_flow(kc)
    for e in kc.executions(FLOW):
        print(f"  {'  ' * e['level']}{e['displayName']}: {e['requirement']}")


if __name__ == "__main__":
    main()

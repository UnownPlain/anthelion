#!/usr/bin/env bash
set -euo pipefail
umask 077

case "${1:-}" in
restore | save) ;;
*)
	echo 'Usage: infisical.sh restore|save' >&2
	exit 1
	;;
esac

codex_auth_dir="${CODEX_HOME:-$HOME/.codex}"
codex_auth_file="$codex_auth_dir/auth.json"

if [[ "$1" == restore ]]; then
	oidc_token="$(
		curl --fail --silent --show-error \
			-H "Authorization: Bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
			"${ACTIONS_ID_TOKEN_REQUEST_URL}&audience=https://github.com/${GITHUB_REPOSITORY_OWNER}" |
			jq -r '.value'
	)"
	printf '::add-mask::%s\n' "$oidc_token"

	INFISICAL_TOKEN="$(
		infisical login --method=oidc-auth \
			--machine-identity-id "$INFISICAL_IDENTITY_ID" --jwt "$oidc_token" \
			--silent --plain
	)"
	export INFISICAL_TOKEN
	printf '::add-mask::%s\n' "$INFISICAL_TOKEN"
	unset oidc_token

	mkdir -p "$codex_auth_dir"
	infisical secrets-manager secrets get CODEX_AUTH_JSON --plain --silent --expand=false \
		--projectId "$INFISICAL_PROJECT_ID" --env "$INFISICAL_ENVIRONMENT" >"$codex_auth_file"
	chmod 600 "$codex_auth_file"

	infisical export --format=json --silent --expand=false \
		--projectId "$INFISICAL_PROJECT_ID" --env "$INFISICAL_ENVIRONMENT" |
		jq -r '.[] | select(.key != "CODEX_AUTH_JSON") | "\(.key)=\(.value)"' >>"$GITHUB_ENV"
	printf 'INFISICAL_TOKEN=%s\n' "$INFISICAL_TOKEN" >>"$GITHUB_ENV"
fi

while IFS= read -r token; do
	printf '::add-mask::%s\n' "$token"
done < <(jq -r '.tokens | .access_token, .refresh_token, .id_token // empty' "$codex_auth_file")

if [[ "$1" == save ]]; then
	infisical secrets-manager secrets update "CODEX_AUTH_JSON=@$codex_auth_file" --silent \
		--projectId "$INFISICAL_PROJECT_ID" --env "$INFISICAL_ENVIRONMENT" >/dev/null
fi

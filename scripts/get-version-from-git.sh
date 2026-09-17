#!/usr/bin/env bash

# Echoes a version based on the git hashes of the element-web & js-sdk checkouts, for the case where
# these dependencies are git checkouts.

set -e

VECTOR_SHA=$(git rev-parse --short=12 HEAD) # use the ACTUAL SHA rather than assume develop

# The js-sdk is only a git checkout when something has linked one in: scripts/docker-link-repos.sh
# does so when building `develop` or when USE_CUSTOM_SDKS is set, and a developer may have done the
# same by hand. Installed as an ordinary dependency it is an unpacked tarball with no .git to read,
# so fall back to naming element-web alone rather than failing the build.
JSSDK_DIR="$(pnpm -w root)/matrix-js-sdk"
if [ -e "$JSSDK_DIR/.git" ]; then
    JSSDK_SHA=$(git -C "$JSSDK_DIR" rev-parse --short=12 HEAD)
    echo "$VECTOR_SHA-js-$JSSDK_SHA"
else
    echo "$VECTOR_SHA"
fi

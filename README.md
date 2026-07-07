[![Chat](https://img.shields.io/matrix/element-web:matrix.org?logo=matrix)](https://matrix.to/#/#element-web:matrix.org)
![Tests](https://github.com/element-hq/element-web/actions/workflows/tests.yaml/badge.svg)
![Static Analysis](https://github.com/element-hq/element-web/actions/workflows/static_analysis.yaml/badge.svg)
[![Localazy](https://img.shields.io/endpoint?url=https%3A%2F%2Fconnect.localazy.com%2Fstatus%2Felement-web%2Fdata%3Fcontent%3Dall%26title%3Dlocalazy%26logo%3Dtrue)](https://localazy.com/p/element-web)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=element-web&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=element-web)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=element-web&metric=coverage)](https://sonarcloud.io/summary/new_code?id=element-web)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=element-web&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=element-web)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=element-web&metric=bugs)](https://sonarcloud.io/summary/new_code?id=element-web)

# Capacitor

**Capacitor** is a custom fork of [Element Web](https://github.com/element-hq/element-web) — a Matrix
web & desktop client — tailored for our homeserver. It keeps everything that makes Element a solid,
end-to-end-encrypted Matrix client, while reworking the parts of the experience that felt unfamiliar or
clunky for our users.

## Why Capacitor?

The goal is a Matrix client that _feels_ like the chat apps people already use every day. Three themes
drive the work:

1. **Familiar UX for Slack / Discord users.** Reorganise navigation and the room list around the
   mental model people already have, instead of Matrix-specific concepts.
2. **GIF support.** First-class GIF search and sending, right where you'd expect it in the composer.
3. **General UI/UX polish.** Fix the papercuts and rough edges that add up to a worse everyday feel.

## What's different from upstream Element

### More familiar, Slack/Discord-style navigation

- **Room list split into _Channels_ and _Contacts_.** The single "All Chats" list is divided into two
  clear sections — group rooms (Channels) and direct messages (Contacts) — so the layout maps to how
  people think about conversations.
- **Compact, Slack-like room rows.** Smaller avatars and tighter rows fit more conversations on screen.
- **Collapsible space rail.** The left-hand meta-space buttons (Home / "All Chats", Other rooms) are
  tucked behind a single toggle by default and expand on demand, de-cluttering the sidebar.
- **Drag-and-drop room ordering.** Reorder rooms within Channels/Contacts by dragging. The custom order
  is stored in your account data, so it syncs across your devices.

### GIF support

- A **GIF button next to the emoji button** in the message composer opens a searchable GIF picker
  (trending by default, live search as you type). Picking a GIF sends it as an animated image.
- Powered by a configurable provider (Giphy). The API key is read at runtime from `config.json` under
  `gif_provider` and is **never** committed to the repository — see
  [the GIF configuration](#gif-picker-configuration) below.

### UI/UX polish

- **Presence dot fix.** The online/offline indicator now sits correctly on the avatar corner on the
  compact room rows.
- **Quieter encryption shields.** The grey, purely-informational "authenticity can't be guaranteed"
  per-message icon is hidden to reduce noise, while genuine (red) security warnings are kept.
- **Rebranding.** App name, icons, and in-app logos are updated to Capacitor.

## GIF picker configuration

GIF search needs a provider API key, which lives only in your local `config.json` (not in git):

```json
{
    "gif_provider": {
        "provider": "giphy",
        "api_key": "YOUR_GIPHY_API_KEY",
        "rating": "pg-13"
    }
}
```

Without a key the GIF button still appears but the picker prompts you to configure one. Get a free key
from the [Giphy developer dashboard](https://developers.giphy.com/).

---

# Element

Capacitor is built on top of Element. Everything below is upstream Element documentation and remains
accurate for building, running, and configuring the app.

Element (formerly known as Vector and Riot) is a Matrix web & desktop client built using the [Matrix
JS SDK](https://github.com/matrix-org/matrix-js-sdk).

# Supported Environments

Element has several tiers of support for different environments:

- Supported
    - Definition:
        - Issues **actively triaged**, regressions **block** the release
    - Last 2 major versions of Chrome, Firefox, and Edge on desktop OSes
    - Last 2 versions of Safari
    - Latest release of official Element Desktop app on desktop OSes
    - Desktop OSes means macOS, Windows, and Linux versions for desktop devices
      that are actively supported by the OS vendor and receive security updates
- Best effort
    - Definition:
        - Issues **accepted**, regressions **do not block** the release
        - The wider Element Products (including Element Call and the Enterprise Server Suite) do still not officially support these browsers.
        - The element web project and its contributors should keep the client functioning and gracefully degrade where other sibling features (E.g. Element Call) may not function.
    - Last major release of Firefox ESR and Chrome/Edge Extended Stable
- Community Supported
    - Definition:
        - Issues **accepted**, regressions **do not block** the release
        - Community contributions are welcome to support these issues
    - Mobile web for current stable version of Chrome, Firefox, and Safari on Android, iOS, and iPadOS
- Not supported
    - Definition: Issues only affecting unsupported environments are **closed**
    - Everything else

The period of support for these tiers should last until the releases specified above, plus 1 app release cycle(2 weeks). In the case of Firefox ESR this is extended further to allow it land in Debian Stable.

For accessing Element on an Android or iOS device, we currently recommend the
native apps [element-x-android](https://github.com/element-hq/element-x-android)
and [element-x-ios](https://github.com/element-hq/element-x-ios).

# Getting Started

The easiest way to test Element is to just use the hosted copy at <https://app.element.io>.
The `develop` branch is continuously deployed to <https://develop.element.io>
for those who like living dangerously.

To host your own instance of Element see [Installing Element Web](docs/install.md).

To install Element as a desktop application, see [Running as a desktop app](#running-as-a-desktop-app) below.

---

# Monorepo

This repository is a monorepo hosting Element Web and other related projects in various subdirectories.
You can read more about the structure [here](docs/monorepo.md).

# Element Web

To learn more about Element Web [click here](apps/web/README.md)

# Running as a Desktop app

Element can also be run as a desktop app, wrapped in Electron. You can download a
pre-built version from <https://element.io/get-started> or, if you prefer,
build it yourself.

To build it yourself, follow the instructions at <https://github.com/element-hq/element-web/tree/develop/apps/desktop>.

Many thanks to @aviraldg for the initial work on the Electron integration.

The [configuration docs](docs/config.md#desktop-app-configuration) show how to override the desktop app's default settings if desired.

# Development

Please read through the following:

1. [Developer guide](./developer_guide.md)
2. [Code style](./code_style.md)
3. [Contribution guide](./CONTRIBUTING.md)

# Translations

To add a new translation, head to the [translating doc](docs/translating.md).

For a developer guide, see the [translating dev doc](docs/translating-dev.md).

# Triaging issues

Issues are triaged by community members and the Web App Team, following the [triage process](https://github.com/element-hq/element-meta/wiki/Triage-process).

We use [issue labels](https://github.com/element-hq/element-meta/wiki/Issue-labelling) to sort all incoming issues.

## Copyright & License

Copyright (c) 2014-2017 OpenMarket Ltd
Copyright (c) 2017 Vector Creations Ltd
Copyright (c) 2017-2025 New Vector Ltd

This software is multi licensed by New Vector Ltd (Element). It can be used either:

(1) for free under the terms of the GNU Affero General Public License (as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version); OR

(2) for free under the terms of the GNU General Public License (as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version); OR

(3) under the terms of a paid-for Element Commercial License agreement between you and Element (the terms of which may vary depending on what you and Element have agreed to).
Unless required by applicable law or agreed to in writing, software distributed under the Licenses is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the Licenses for the specific language governing permissions and limitations under the Licenses.

Please contact [licensing@element.io](mailto:licensing@element.io) to purchase
an Element commercial license for this software.

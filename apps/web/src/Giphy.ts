/*
Copyright 2026 Capacitor

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import SdkConfig from "./SdkConfig";

/**
 * A single GIF result normalised from the provider response, ready for display and sending.
 */
export interface GifResult {
    /** Provider-specific id, used as a React key. */
    id: string;
    /** Human-readable title (used as the message body / alt text). */
    title: string;
    /** URL of a small rendition used for the picker grid preview. */
    previewUrl: string;
    previewWidth: number;
    previewHeight: number;
    /** URL of the full GIF that gets fetched and sent to the room. */
    url: string;
    width: number;
    height: number;
}

const GIPHY_API_BASE = "https://api.giphy.com/v1/gifs";
const DEFAULT_LIMIT = 24;

function getGifConfig() {
    return SdkConfig.get("gif_provider");
}

/**
 * The configured provider API key, or undefined when the picker has not been set up.
 */
export function getGifApiKey(): string | undefined {
    return getGifConfig()?.api_key || undefined;
}

/**
 * Whether GIF search is configured and usable.
 */
export function isGifSearchConfigured(): boolean {
    return Boolean(getGifApiKey());
}

function getRating(): string {
    return getGifConfig()?.rating || "pg-13";
}

interface GiphyRendition {
    url?: string;
    width?: string;
    height?: string;
}

interface GiphyGif {
    id: string;
    title?: string;
    images: {
        fixed_width?: GiphyRendition;
        downsized?: GiphyRendition;
        original?: GiphyRendition;
    };
}

interface GiphyResponse {
    data?: GiphyGif[];
}

function toInt(value: string | undefined): number {
    const n = parseInt(value ?? "", 10);
    return Number.isFinite(n) ? n : 0;
}

function normaliseGif(gif: GiphyGif): GifResult | null {
    const preview = gif.images.fixed_width ?? gif.images.downsized ?? gif.images.original;
    const full = gif.images.original ?? gif.images.downsized ?? gif.images.fixed_width;
    if (!preview?.url || !full?.url) return null;
    return {
        id: gif.id,
        title: gif.title?.trim() || "GIF",
        previewUrl: preview.url,
        previewWidth: toInt(preview.width),
        previewHeight: toInt(preview.height),
        url: full.url,
        width: toInt(full.width),
        height: toInt(full.height),
    };
}

async function requestGiphy(path: string, params: Record<string, string>, signal?: AbortSignal): Promise<GifResult[]> {
    const apiKey = getGifApiKey();
    if (!apiKey) return [];

    const query = new URLSearchParams({
        api_key: apiKey,
        limit: String(DEFAULT_LIMIT),
        rating: getRating(),
        bundle: "messaging_non_clips",
        ...params,
    });

    const response = await fetch(`${GIPHY_API_BASE}/${path}?${query.toString()}`, { signal });
    if (!response.ok) {
        throw new Error(`Giphy request failed with status ${response.status}`);
    }
    const body: GiphyResponse = await response.json();
    return (body.data ?? []).map(normaliseGif).filter((gif): gif is GifResult => gif !== null);
}

/**
 * Fetch the currently trending GIFs (used as the default picker content).
 */
export function fetchTrendingGifs(signal?: AbortSignal): Promise<GifResult[]> {
    return requestGiphy("trending", {}, signal);
}

/**
 * Search GIFs matching the given query string.
 */
export function searchGifs(query: string, signal?: AbortSignal): Promise<GifResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return fetchTrendingGifs(signal);
    return requestGiphy("search", { q: trimmed, lang: "en" }, signal);
}

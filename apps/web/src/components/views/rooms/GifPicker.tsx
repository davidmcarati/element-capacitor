/*
Copyright 2026 Capacitor

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React, { type JSX, useEffect, useRef, useState } from "react";
import { SearchIcon } from "@vector-im/compound-design-tokens/assets/web/icons";

import { _t } from "../../../languageHandler";
import AccessibleButton from "../elements/AccessibleButton";
import Spinner from "../elements/Spinner";
import { fetchTrendingGifs, type GifResult, isGifSearchConfigured, searchGifs } from "../../../Giphy";

interface IProps {
    /** Invoked when a GIF is chosen. Should trigger sending and closing. */
    onChoose: (gif: GifResult) => void;
    /** The id of the GIF currently being sent, if any (disables the grid + shows a spinner overlay). */
    sendingId?: string;
}

const SEARCH_DEBOUNCE_MS = 400;

export default function GifPicker({ onChoose, sendingId }: IProps): JSX.Element {
    const configured = isGifSearchConfigured();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<GifResult[]>([]);
    const [loading, setLoading] = useState(configured);
    const [error, setError] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (!configured) return;

        const controller = new AbortController();
        setError(false);
        setLoading(true);

        const timer = setTimeout(async () => {
            try {
                const gifs = query.trim() ? await searchGifs(query, controller.signal) : await fetchTrendingGifs(controller.signal);
                setResults(gifs);
            } catch (e) {
                if (!controller.signal.aborted) setError(true);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, SEARCH_DEBOUNCE_MS);

        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [query, configured]);

    let body: JSX.Element;
    if (!configured) {
        body = (
            <div className="mx_GifPicker_message">
                {_t("composer|gif_picker|not_configured")}
            </div>
        );
    } else if (loading) {
        body = (
            <div className="mx_GifPicker_message">
                <Spinner />
            </div>
        );
    } else if (error) {
        body = <div className="mx_GifPicker_message">{_t("composer|gif_picker|error")}</div>;
    } else if (results.length === 0) {
        body = <div className="mx_GifPicker_message">{_t("composer|gif_picker|no_results")}</div>;
    } else {
        body = (
            <div className="mx_GifPicker_grid">
                {results.map((gif) => (
                    <AccessibleButton
                        key={gif.id}
                        className="mx_GifPicker_result"
                        onClick={() => onChoose(gif)}
                        disabled={sendingId !== undefined}
                        title={gif.title}
                    >
                        <img
                            src={gif.previewUrl}
                            alt={gif.title}
                            loading="lazy"
                            style={
                                gif.previewWidth && gif.previewHeight
                                    ? { aspectRatio: `${gif.previewWidth} / ${gif.previewHeight}` }
                                    : undefined
                            }
                        />
                        {sendingId === gif.id && (
                            <div className="mx_GifPicker_result_sending">
                                <Spinner />
                            </div>
                        )}
                    </AccessibleButton>
                ))}
            </div>
        );
    }

    return (
        <div className="mx_GifPicker">
            <div className="mx_GifPicker_search">
                <SearchIcon className="mx_GifPicker_search_icon" />
                <input
                    ref={inputRef}
                    type="text"
                    autoComplete="off"
                    placeholder={_t("composer|gif_picker|search_placeholder")}
                    value={query}
                    onChange={(ev) => setQuery(ev.target.value)}
                    disabled={!configured}
                />
            </div>
            {body}
            <div className="mx_GifPicker_attribution">{_t("composer|gif_picker|powered_by")}</div>
        </div>
    );
}

/*
Copyright 2026 Capacitor

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import classNames from "classnames";
import React, { type JSX, useContext, useState } from "react";
import { type IEventRelation } from "matrix-js-sdk/src/matrix";
import { logger } from "matrix-js-sdk/src/logger";

import { _t } from "../../../languageHandler";
import ContextMenu, { aboveLeftOf, type MenuProps, useContextMenu } from "../../structures/ContextMenu";
import { CollapsibleButton } from "./CollapsibleButton";
import { OverflowMenuContext } from "./MessageComposerButtons";
import MatrixClientContext from "../../../contexts/MatrixClientContext";
import ContentMessages from "../../../ContentMessages";
import Modal from "../../../Modal";
import ErrorDialog from "../dialogs/ErrorDialog";
import GifPicker from "./GifPicker";
import { type GifResult } from "../../../Giphy";

interface IGifButtonProps {
    roomId: string;
    relation?: IEventRelation;
    menuPosition?: MenuProps;
    className?: string;
}

function gifFileName(title: string): string {
    const cleaned = title.replace(/[\\/:*?"<>|]+/g, " ").trim() || "GIF";
    return cleaned.toLowerCase().endsWith(".gif") ? cleaned : `${cleaned}.gif`;
}

export function GifButton({ roomId, relation, menuPosition, className }: IGifButtonProps): JSX.Element {
    const matrixClient = useContext(MatrixClientContext);
    const overflowMenuCloser = useContext(OverflowMenuContext);
    const [menuDisplayed, button, openMenu, closeMenu] = useContextMenu();
    const [sendingId, setSendingId] = useState<string | undefined>(undefined);

    const onChoose = async (gif: GifResult): Promise<void> => {
        if (!matrixClient || sendingId !== undefined) return;
        setSendingId(gif.id);
        try {
            const response = await fetch(gif.url);
            if (!response.ok) throw new Error(`Failed to fetch GIF: HTTP ${response.status}`);
            const blob = await response.blob();
            const type = blob.type.startsWith("image/") ? blob.type : "image/gif";
            const file = new File([blob], gifFileName(gif.title), { type });

            await ContentMessages.sharedInstance().sendContentToRoom(file, roomId, relation, matrixClient, undefined);

            closeMenu();
            overflowMenuCloser?.();
        } catch (e) {
            logger.error("Failed to send GIF", e);
            Modal.createDialog(ErrorDialog, {
                title: _t("composer|gif_picker|error_title"),
                description: _t("composer|gif_picker|error_send"),
            });
        } finally {
            setSendingId(undefined);
        }
    };

    let contextMenu: React.ReactElement | null = null;
    if (menuDisplayed && button.current) {
        const position = menuPosition ?? aboveLeftOf(button.current.getBoundingClientRect());
        const onFinished = (): void => {
            // Don't allow dismissing the picker while a GIF is still uploading.
            if (sendingId !== undefined) return;
            closeMenu();
            overflowMenuCloser?.();
        };

        contextMenu = (
            <ContextMenu {...position} onFinished={onFinished} managed={false} focusLock>
                <GifPicker onChoose={onChoose} sendingId={sendingId} />
            </ContextMenu>
        );
    }

    const computedClassName = classNames("mx_GifButton", className, {
        mx_GifButton_highlight: menuDisplayed,
    });

    return (
        <>
            <CollapsibleButton
                className={computedClassName}
                onClick={openMenu}
                title={_t("composer|gif_button")}
                inputRef={button}
            >
                <span className="mx_GifButton_label">GIF</span>
            </CollapsibleButton>

            {contextMenu}
        </>
    );
}

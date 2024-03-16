import React, { useState } from "react";
import {
  Editor,
  EditorState,
  RichUtils,
  Modifier,
  convertToRaw,
  convertFromRaw,
} from "draft-js";
import "draft-js/dist/Draft.css";
const customStyleMap = {
  redLine: {
    color: "red",
  },
  underline: {
    textDecoration: "underline",
  },
  codeBlock: {
    backgroundColor: "#f0f0f0",
    padding: "8px",
    fontFamily: "monospace",
    marginTop: "12px",
    marginBottom: "12px",
  },
};

const EditorFault = () => {
  const [editorState, setEditorState] = useState(() => {
    const savedContent = localStorage.getItem("draftEditorContent");
    if (savedContent) {
      return EditorState.createWithContent(
        convertFromRaw(JSON.parse(savedContent))
      );
    } else {
      return EditorState.createEmpty();
    }
  });

  const handleBeforeInput = (char) => {
    const contentState = editorState.getCurrentContent();
    const selectionState = editorState.getSelection();
    const selection = editorState.getSelection();
    const currentContent = editorState.getCurrentContent();
    const currentBlock = currentContent.getBlockForKey(selection.getStartKey());
    const blockType = currentBlock.getType();
    const blockText = currentBlock.getText();
    const startOffset = selection.getStartOffset();
    if (char === " ") {
      if (
        blockType === "unstyled" &&
        blockText.startsWith("*") &&
        startOffset === 1
      ) {
        console.log("inside second block");

        const newEditorState = EditorState.push(
          editorState,
          Modifier.replaceText(
            contentState,
            selectionState.merge({
              anchorOffset: startOffset - 1,
              focusOffset: startOffset,
            }),
            ""
          )
        );
        setEditorState(RichUtils.toggleInlineStyle(newEditorState, "BOLD"));
        return "handled";
      } else if (
        blockType === "unstyled" &&
        blockText.startsWith("**") &&
        startOffset === 2
      ) {
        console.log("inside third block");

        const newEditorState = EditorState.push(
          editorState,
          Modifier.replaceText(
            contentState,
            selectionState.merge({
              anchorOffset: startOffset - 2,
              focusOffset: startOffset,
            }),
            ""
          )
        );
        setEditorState(RichUtils.toggleInlineStyle(newEditorState, "redLine"));
        return "handled";
      }
    }
    return "not-handled";
  };

  const handleReturn = (event) => {
    const currentBlockType = RichUtils.getCurrentBlockType(editorState);
    const currentStyle = editorState.getCurrentInlineStyle();
    const isBold = currentStyle.has("BOLD");
    const isRedLine = currentStyle.has("redLine");

    if (isBold || isRedLine) {
      // Toggle off the current inline style
      let newEditorState = editorState;
      if (isBold) {
        newEditorState = RichUtils.toggleInlineStyle(newEditorState, "BOLD");
      }
      if (isRedLine) {
        newEditorState = RichUtils.toggleInlineStyle(newEditorState, "redLine");
        // Remove the bold style if redLine is applied
        const contentState = newEditorState.getCurrentContent();
        const selectionState = newEditorState.getSelection();
        const contentStateWithoutBold = Modifier.removeInlineStyle(
          contentState,
          selectionState,
          "BOLD"
        );
        newEditorState = EditorState.push(
          newEditorState,
          contentStateWithoutBold,
          "change-inline-style"
        );
      }

      // Insert a new line with no inline styles
      const contentStateWithNewLine = Modifier.splitBlock(
        newEditorState.getCurrentContent(),
        newEditorState.getSelection()
      );

      // Push the new content state to update the editor state
      newEditorState = EditorState.push(
        newEditorState,
        contentStateWithNewLine,
        "split-block"
      );

      // Set the new editor state
      setEditorState(newEditorState);

      // Handled the return
      return "handled";
    }

    // Not handled
    return "not-handled";
  };

  return (
    <div
      style={{
        border: "1px solid black",
        borderRadius: "16px",
        margin: "20px",
        padding: "12px",
      }}
      className="editor-container"
    >
      <Editor
        editorState={editorState}
        onChange={setEditorState}
        handleBeforeInput={handleBeforeInput}
        handleReturn={handleReturn}
        customStyleMap={customStyleMap}
      />
    </div>
  );
};

export default EditorFault;

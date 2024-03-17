import React, { useState, useEffect } from "react";
import {
  Editor,
  EditorState,
  RichUtils,
  Modifier,
  ContentState,
} from "draft-js";
import "draft-js/dist/Draft.css";
import { stateToHTML } from "draft-js-export-html";
import { stateFromHTML } from "draft-js-import-html";

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
    margin: "16px",
  },
};

const MyEditor = () => {
  const [editorState, setEditorState] = useState(() => {
    const savedContent = localStorage.getItem("draftEditorContent");
    if (savedContent) {
      return EditorState.createWithContent(
        ContentState.createFromText(savedContent)
      );
    }
    return EditorState.createEmpty();
  });
  useEffect(() => {
    const savedContent = localStorage.getItem("draftEditorContent");
    if (savedContent) {
      const contentState = stateFromHTML(savedContent);
      const newEditorState = EditorState.createWithContent(contentState);
      setEditorState(newEditorState);
    } else {
      setEditorState(EditorState.createEmpty());
    }
  }, []);
  const removeInlineStyles = (editorState, stylesToRemove) => {
    let contentState = editorState.getCurrentContent();
    let selection = editorState.getSelection();

    stylesToRemove.forEach((style) => {
      contentState = Modifier.removeInlineStyle(contentState, selection, style);
    });

    const newEditorState = EditorState.push(
      editorState,
      contentState,
      "change-inline-style"
    );
    return EditorState.forceSelection(
      newEditorState,
      contentState.getSelectionAfter()
    );
  };

  const handleBeforeInput = (chars, editorState) => {
    const contentState = editorState.getCurrentContent();
    const selectionState = editorState.getSelection();
    const startKey = selectionState.getStartKey();
    const startOffset = selectionState.getStartOffset();
    const block = contentState.getBlockForKey(startKey);
    const blockText = block.getText();
    const selection = editorState.getSelection();
    const currentContent = editorState.getCurrentContent();
    const currentBlock = currentContent.getBlockForKey(selection.getStartKey());
    const blockType = currentBlock.getType();

    if (chars === " ") {
      if (
        blockType === "unstyled" &&
        blockText.startsWith("#") &&
        startOffset === 1
      ) {
        const contentState = Modifier.replaceText(
          currentContent,
          selection.merge({
            anchorOffset: 0,
            focusOffset: 1,
          }),
          ""
        );
        const newEditorState = EditorState.push(
          editorState,
          contentState,
          "remove-range"
        );
        setEditorState(RichUtils.toggleBlockType(newEditorState, "header-one"));
        return "handled";
      } else if (
        blockType === "unstyled" &&
        blockText.startsWith("*") &&
        startOffset === 1
      ) {
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
      } else if (blockType === "unstyled" && blockText.includes("***")) {
        const newEditorState = EditorState.push(
          editorState,
          Modifier.replaceText(
            contentState,
            selectionState.merge({
              anchorOffset: startOffset - 3,
              focusOffset: startOffset,
            }),
            ""
          )
        );
        setEditorState(
          RichUtils.toggleInlineStyle(newEditorState, "underline")
        );
        return "handled";
      } else if (blockType === "unstyled" && blockText.includes("**")) {
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
      } else if (
        blockType === "unstyled" &&
        blockText.startsWith("```") &&
        startOffset === 3
      ) {
        const newEditorState = EditorState.push(
          editorState,
          Modifier.replaceText(
            contentState,
            selectionState.merge({
              anchorOffset: startOffset - 3,
              focusOffset: startOffset,
            }),
            ""
          )
        );
        setEditorState(
          RichUtils.toggleInlineStyle(newEditorState, "codeBlock")
        );
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
    const isUnderline = currentStyle.has("underline");
    const isCodeBlock = currentStyle.has("codeBlock");

    // Check if the current block type is a header-one
    if (currentBlockType === "header-one") {
      // Create a new content state with an unstyled block
      const contentStateWithNewLine = Modifier.splitBlock(
        editorState.getCurrentContent(),
        editorState.getSelection()
      );

      // Push the new content state to update the editor state
      const newContentState = Modifier.setBlockType(
        contentStateWithNewLine,
        contentStateWithNewLine.getSelectionAfter(),
        "unstyled"
      );

      // Create a new editor state with the updated content state
      const newEditorState = EditorState.push(
        editorState,
        newContentState,
        "split-block"
      );

      // Set the new editor state
      setEditorState(newEditorState);

      // Handled the return
      return "handled";
    } else {
      const contentStateWithNewLine = Modifier.splitBlock(
        editorState.getCurrentContent(),
        editorState.getSelection()
      );

      // Create a new editor state with the updated content state
      const newEditorState = EditorState.push(
        editorState,
        contentStateWithNewLine,
        "split-block"
      );

      let stylesToRemove = [];
      if (isBold) {
        stylesToRemove = ["redLine", "underline", "codeBlock"];
      } else if (isRedLine) {
        stylesToRemove = ["BOLD", "underline", "codeBlock"];
      } else if (isUnderline) {
        stylesToRemove = ["BOLD", "redLine", "codeBlock"];
      } else if (isCodeBlock) {
        stylesToRemove = ["BOLD", "redLine", "underline"];
      }

      // Remove other inline styles except the one being applied in the current line
      const removedAllCSSEditor = removeInlineStyles(
        newEditorState,
        stylesToRemove
      );

      // Set the new editor state
      setEditorState(removedAllCSSEditor);

      // Return "handled" to prevent default behavior
      return "handled";
    }
  };

  const onSave = () => {
    const content = stateToHTML(editorState.getCurrentContent());
    localStorage.setItem("draftEditorContent", content);
    alert("Content saved successfully!");
  };

  return (
    <div style={{ margin: "20px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ marginBottom: "10px" }}>
        <button
          onClick={onSave}
          style={{
            marginRight: "10px",
            padding: "8px 16px",
            borderRadius: "4px",
            background: "#007bff",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Save
        </button>
        (Use # for heading, * for bold, ** for red line, *** for underline, and
        ````` for code block)
      </div>
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "12px",
          minHeight: "200px",
        }}
      >
        <Editor
          editorState={editorState}
          onChange={setEditorState}
          handleBeforeInput={handleBeforeInput}
          customStyleMap={customStyleMap}
          handleReturn={handleReturn}
        />
      </div>
    </div>
  );
};

export default MyEditor;

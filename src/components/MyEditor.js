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
    console.log(
      blockType,
      "blockType",
      blockText,
      "blockText",
      startOffset,
      "startOffset"
    );
    if (chars === " ") {
      if (
        blockType === "unstyled" &&
        blockText.startsWith("#") &&
        startOffset === 1
      ) {
        console.log("inside first block");
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
      } else if (
        blockType === "unstyled" &&
        blockText.startsWith("***") &&
        startOffset === 3
      ) {
        console.log("inside third block");

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
      } else if (
        blockType === "unstyled" &&
        blockText.startsWith("```") &&
        startOffset === 3
      ) {
        console.log("inside fourth block");

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
    console.log(currentBlockType, "currentBlockType");
    if (currentBlockType === "header-one") {
      // Create a new content state with unstyled block
      const contentStateWithNewLine = Modifier.splitBlock(
        editorState.getCurrentContent(),
        editorState.getSelection()
      );

      // Push the new content state to update the editor state
      let newEditorState = EditorState.push(
        editorState,
        contentStateWithNewLine,
        "split-block"
      );

      // Toggle block type to unstyled for the new line
      newEditorState = RichUtils.toggleBlockType(newEditorState, "unstyled");

      // Set the new editor state
      setEditorState(newEditorState);

      // Handled the return
      return "handled";
    } else if (isBold) {
      const newEditorState = RichUtils.toggleInlineStyle(editorState, "BOLD");
      const contentStateWithNewLine = Modifier.insertText(
        newEditorState.getCurrentContent(),
        newEditorState.getSelection(),
        "\n"
      );
      const newEditorStateWithNewLine = EditorState.push(
        newEditorState,
        contentStateWithNewLine,
        "insert-characters"
      );
      setEditorState(newEditorStateWithNewLine);
      return "handled";
    } else if (isRedLine) {
      const newEditorState = RichUtils.toggleInlineStyle(
        editorState,
        "redLine"
      );
      const contentStateWithNewLine = Modifier.insertText(
        newEditorState.getCurrentContent(),
        newEditorState.getSelection(),
        "\n"
      );
      const newEditorStateWithNewLine = EditorState.push(
        newEditorState,
        contentStateWithNewLine,
        "insert-characters"
      );
      setEditorState(newEditorStateWithNewLine);
      return "handled";
    } else if (isUnderline) {
      const newEditorState = RichUtils.toggleInlineStyle(
        editorState,
        "underline"
      );
      const contentStateWithNewLine = Modifier.insertText(
        newEditorState.getCurrentContent(),
        newEditorState.getSelection(),
        "\n"
      );
      const newEditorStateWithNewLine = EditorState.push(
        newEditorState,
        contentStateWithNewLine,
        "insert-characters"
      );
      setEditorState(newEditorStateWithNewLine);
      return "handled";
    } else if (isCodeBlock) {
      const newEditorState = RichUtils.toggleInlineStyle(
        editorState,
        "codeBlock"
      );
      const contentStateWithNewLine = Modifier.insertText(
        newEditorState.getCurrentContent(),
        newEditorState.getSelection(),
        "\n"
      );
      const newEditorStateWithNewLine = EditorState.push(
        newEditorState,
        contentStateWithNewLine,
        "insert-characters"
      );
      setEditorState(newEditorStateWithNewLine);
      return "handled";
    } else {
      return "not-handled";
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
        <button onClick={onSave} style={{ marginRight: "10px" }}>
          Save
        </button>
        (Use # for heading, * for bold, ** for red line, *** for underline, and
        ````` for code block)
      </div>
      <div
        style={{
          border: "1px solid black",
          borderRadius: "16px",
          margin: "20px",
          padding: "12px",
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

import React, { useState, useEffect } from "react";
import {
  Editor,
  EditorState,
  RichUtils,
  ContentState,
  getDefaultKeyBinding,
  KeyBindingUtil,
} from "draft-js";
import "draft-js/dist/Draft.css";

const { hasCommandModifier } = KeyBindingUtil;

const EditorComponent = () => {
  const [editorState, setEditorState] = useState(() => {
    const savedContent = localStorage.getItem("draftjs-content");
    return savedContent
      ? EditorState.createWithContent(ContentState.createFromText(savedContent))
      : EditorState.createEmpty();
  });

  // useEffect(() => {
  //   localStorage.setItem(
  //     "draftjs-content",
  //     JSON.stringify(editorState.getCurrentContent())
  //   );
  // }, [editorState]);

  const handleKeyCommand = (command) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return "handled";
    }
    return "not-handled";
  };

  const handleChange = (newState) => {
    setEditorState(newState);
  };

  const handleBeforeInput = (chars, editorState) => {
    const selection = editorState.getSelection();
    const currentContent = editorState.getCurrentContent();
    const currentBlock = currentContent.getBlockForKey(selection.getStartKey());
    const text = currentBlock.getText();

    // If the first character is '#' and at the beginning of the line
    if (text.startsWith("#") && chars === " ") {
      setEditorState(RichUtils.toggleBlockType(editorState, "header-one"));
      return "handled";
    }

    // If the first character is '*' and at the beginning of the line
    console.log(
      text,
      "text",
      text.startsWith("*") && chars === " ",
      "condition",
      text.startsWith("*"),
      "check *",
      chars === " ",
      "check space"
    );
    if (text.startsWith("*") && chars === " ") {
      setEditorState(RichUtils.toggleInlineStyle(editorState, "BOLD"));
      return "handled";
    }

    // If the text starts with '**' and followed by a space
    if (text.startsWith("**") && chars === " ") {
      setEditorState(RichUtils.toggleInlineStyle(editorState, "STRIKETHROUGH"));
      return "handled";
    }

    // If the text starts with '***' and followed by a space
    if (text.startsWith("***") && chars === " ") {
      setEditorState(RichUtils.toggleInlineStyle(editorState, "UNDERLINE"));
      return "handled";
    }

    // If the text starts with '```' and followed by a space
    if (text.startsWith("```") && chars === " ") {
      setEditorState(RichUtils.toggleBlockType(editorState, "code-block"));
      return "handled";
    }

    return "not-handled";
  };

  const keyBindingFn = (e) => {
    if (e.keyCode === 83 && hasCommandModifier(e)) {
      // Save shortcut (Cmd+S)
      return "save-content";
    }
    return getDefaultKeyBinding(e);
  };

  const handleKeyBinding = (command) => {
    if (command === "save-content") {
      console.log(
        "Save to localStorage:",
        editorState.getCurrentContent().getPlainText()
      );
      return null;
    }
    return getDefaultKeyBinding(command);
  };

  return (
    <div className="editor-container">
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
          onChange={handleChange}
          handleKeyCommand={handleKeyCommand}
          handleBeforeInput={(chars) => handleBeforeInput(chars, editorState)}
          keyBindingFn={keyBindingFn}
          handleKeyBinding={handleKeyBinding}
        />
      </div>
    </div>
  );
};

export default EditorComponent;

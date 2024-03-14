import React, { useState, useEffect } from "react";
import {
  Editor,
  EditorState,
  RichUtils,
  Modifier,
  ContentState,
  CompositeDecorator,
} from "draft-js";
import "draft-js/dist/Draft.css";
import { stateToHTML } from "draft-js-export-html";
import { stateFromHTML } from "draft-js-import-html";

const customStyleMap = {
  redLine: {
    borderBottom: "2px solid red",
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

const InlineStyles = new CompositeDecorator([
  {
    strategy: (contentBlock, callback) => {
      contentBlock.findEntityRanges((character) => {
        const entityKey = character.getEntity();
        return (
          entityKey !== null &&
          EditorState.getCurrentContent().getEntity(entityKey).getType() ===
            "BOLD"
        );
      }, callback);
    },
    component: (props) => <strong>{props.children}</strong>,
  },
]);

const MyEditor = () => {
  const [editorState, setEditorState] = useState(() => {
    const savedContent = localStorage.getItem("draftEditorContent");
    if (savedContent) {
      return EditorState.createWithContent(
        ContentState.createFromText(savedContent),
        InlineStyles
      );
    }
    return EditorState.createEmpty(InlineStyles);
  });
  useEffect(() => {
    const savedContent = localStorage.getItem("draftEditorContent");
    if (savedContent) {
      const contentState = stateFromHTML(savedContent);
      const newEditorState = EditorState.createWithContent(contentState);
      setEditorState(newEditorState);
    } else {
      setEditorState(EditorState.createEmpty(InlineStyles));
    }
  }, []);

  const handleBeforeInput = (chars, editorState) => {
    const contentState = editorState.getCurrentContent();
    const selectionState = editorState.getSelection();
    const startKey = selectionState.getStartKey();
    const startOffset = selectionState.getStartOffset();
    const block = contentState.getBlockForKey(startKey);
    const blockText = block.getText();
    const charBeforeCursor = blockText.charAt(startOffset - 1);

    if (chars === " ") {
      if (charBeforeCursor === "#") {
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
        setEditorState(RichUtils.toggleBlockType(newEditorState, "header-one"));
        return "handled";
      } else if (charBeforeCursor === "*") {
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
      }
    } else if (
      charBeforeCursor === "*" &&
      blockText.charAt(startOffset - 2) === "*"
    ) {
      console.log("inside third condition");
      const newEditorState = EditorState.push(
        editorState,
        Modifier.applyInlineStyle(contentState, selectionState, "redLine")
      );
      setEditorState(newEditorState);
      return "handled";
    } else if (
      charBeforeCursor === "*" &&
      blockText.charAt(startOffset - 2) === "*" &&
      blockText.charAt(startOffset - 3) === "*"
    ) {
      const newEditorState = EditorState.push(
        editorState,
        Modifier.applyInlineStyle(contentState, selectionState, "underline")
      );
      setEditorState(newEditorState);
      return "handled";
    } else if (blockText.slice(startOffset - 3, startOffset + 1) === "``` ") {
      const newEditorState = EditorState.push(
        editorState,
        Modifier.applyInlineStyle(contentState, selectionState, "codeBlock")
      );
      setEditorState(newEditorState);
      return "handled";
    }

    return "not-handled";
  };

  const handleReturn = (event) => {
    const currentBlockType = RichUtils.getCurrentBlockType(editorState);
    const currentStyle = editorState.getCurrentInlineStyle();
    console.log(currentBlockType, "currentBlockType");
    console.log(currentStyle.size, "currentStyle");
    const isBold = currentStyle.has("BOLD");
    if (currentBlockType === "header-one") {
      const newEditorState = RichUtils.toggleInlineStyle(
        editorState,
        "header-one"
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
      return "handled"; // Return 'handled' to prevent default behavior
    } else {
      if (isBold) {
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
        return "handled"; // Return 'handled' to prevent default behavior
      } else {
        return "not-handled"; // Return 'handled' to prevent default behavior
      }
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
          //   handleKeyCommand={handleKeyCommand}
          handleBeforeInput={handleBeforeInput}
          //   keyBindingFn={keyBindingFn}
          customStyleMap={customStyleMap}
          handleReturn={handleReturn}
        />
      </div>
    </div>
  );
};

export default MyEditor;

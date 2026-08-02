import React, { useRef } from "react";
import ReactQuill from "react-quill";
import "quill/dist/quill.snow.css"; // Import CSS from quill@2.0.3

// Define props for QuillEditor
interface QuillEditorProps {
  value?: string;
  onChange?: (value: string) => void;
}

const QuillEditor: React.FC<QuillEditorProps> = ({ value = "", onChange }) => {
  const quillRef = useRef<ReactQuill | null>(null);

  // Quill toolbar configuration
  const modules = {
    toolbar: [
      [{ font: [] }, { size: ["small", false, "large", "huge"] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ script: "sub" }, { script: "super" }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["blockquote", "code-block"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ direction: "rtl" }],
      [{ align: [] }],
      ["link", "image", "video", "formula"],
      ["clean"],
    ],
  };

  // Quill formats
  const formats = [
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "script",
    "header",
    "blockquote",
    "code-block",
    "list",
    "bullet",
    "indent",
    "direction",
    "align",
    "link",
    "image",
    "video",
    "formula",
  ];

  return (
    <div style={{ padding: "0" }}>
      <style>
        {`
          .ql-toolbar.ql-snow {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px 6px 0 0;
            padding: 8px;
          }
          .ql-toolbar.ql-snow .ql-formats button,
          .ql-toolbar.ql-snow .ql-formats select {
            color: #1f2937;
            margin: 0 2px;
          }
          .ql-toolbar.ql-snow .ql-formats button:hover,
          .ql-toolbar.ql-snow .ql-formats button.ql-active,
          .ql-toolbar.ql-snow .ql-formats select:hover {
            background-color: #e5e7eb;
            color: #111827;
            border-radius: 4px;
          }
          .ql-toolbar.ql-snow .ql-picker-label {
            color: #1f2937;
          }
          .ql-toolbar.ql-snow .ql-picker-label:hover,
          .ql-toolbar.ql-snow .ql-picker-item:hover {
            background-color: #e5e7eb;
            color: #111827;
          }
          .ql-container.ql-snow {
            border: 1px solid #e2e8f0;
            border-radius: 0 0 6px 6px;
            background-color: #ffffff;
          }
          .ql-editor {
            min-height: 150px;
            color: #111827;
            background-color: #ffffff;
            padding: 12px;
            line-height: 1.5;
          }
        `}
      </style>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value} // Controlled by form value
        onChange={onChange} // Directly pass onChange to ReactQuill
        modules={modules}
        formats={formats}
        placeholder="Describe the proposed treatment plan (if known)"
      />
    </div>
  );
};

export default QuillEditor;

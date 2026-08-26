import React, { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css"; // Import Quill's snow theme CSS

interface QuillViewerProps {
  content: string; // e.g., "<p>n</p>"
}

const QuillViewer: React.FC<QuillViewerProps> = ({ content }) => {
  const quillRef = useRef<HTMLDivElement | null>(null);
  const quillInstance = useRef<Quill | null>(null);

  useEffect(() => {
    if (quillRef.current && !quillInstance.current) {
      // Initialize Quill in read-only mode
      quillInstance.current = new Quill(quillRef.current, {
        theme: "snow",
        readOnly: true,
        modules: {
          toolbar: false, // No toolbar for display-only
        },
      });
    }

    // Update content when it changes
    if (quillInstance.current) {
      quillInstance.current.root.innerHTML = content;
    }

    // Cleanup on unmount
    return () => {
      if (quillInstance.current) {
        quillInstance.current = null;
      }
    };
  }, [content]);

  return (
    <div style={{ width: "100%", padding: "0" }}>
      <style>
        {`
          /* Ensure the container takes full width and has no borders */
          .ql-container.ql-snow {
            width: 100% !important;
            border: none !important;
            background-color: #ffffff;
            border-radius: 0 !important;
          }

          /* Ensure the editor takes full width and has no borders */
          .ql-editor {
            width: 100% !important;
            min-height: 150px;
            color: #111827;
            background-color: #ffffff;
            padding: 12px;
            line-height: 1.5;
            border: none !important;
          }

          /* Remove any inherited borders or margins */
          .ql-snow .ql-editor::before {
            display: none; /* Hide placeholder pseudo-element if no content */
          }
        `}
      </style>
      <div ref={quillRef} style={{ minHeight: "150px", background: "#fff" }} />
    </div>
  );
};

export default QuillViewer;

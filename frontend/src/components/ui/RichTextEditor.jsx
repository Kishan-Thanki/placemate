import React, { useEffect, useMemo, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import HardBreak from '@tiptap/extension-hard-break';
import Dropcursor from '@tiptap/extension-dropcursor';
import Gapcursor from '@tiptap/extension-gapcursor';
import Typography from '@tiptap/extension-typography';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Undo,
  Redo,
  Quote,
  Code,
  Minus,
} from 'lucide-react';

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter job description...',
}) {
  const { isDark } = useTheme();

  // Custom styles for the editor
  const editorStyles = `
    .ProseMirror {
      min-height: 200px;
      padding: 1rem;
      outline: none;
    }
    .ProseMirror:focus {
      outline: none;
    }
    .ProseMirror p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      float: left;
      color: ${isDark ? '#6b7280' : '#9ca3af'};
      pointer-events: none;
      height: 0;
    }
    .ProseMirror h1 {
      font-size: 2em;
      font-weight: bold;
      margin: 0.5em 0;
    }
    .ProseMirror h2 {
      font-size: 1.5em;
      font-weight: bold;
      margin: 0.5em 0;
    }
    .ProseMirror h3 {
      font-size: 1.25em;
      font-weight: bold;
      margin: 0.5em 0;
    }
    .ProseMirror ul, .ProseMirror ol {
      padding-left: 1.5rem;
      margin: 0.5em 0;
    }
    .ProseMirror ul {
      list-style-type: disc;
    }
    .ProseMirror ol {
      list-style-type: decimal;
    }
    .ProseMirror li {
      margin: 0.25em 0;
    }
    .ProseMirror blockquote {
      border-left: 3px solid ${isDark ? '#4b5563' : '#d1d5db'};
      padding-left: 1rem;
      margin: 0.5em 0;
      font-style: italic;
    }
    .ProseMirror code {
      background-color: ${isDark ? '#374151' : '#f3f4f6'};
      padding: 0.2em 0.4em;
      border-radius: 0.25rem;
      font-family: monospace;
    }
    .ProseMirror pre {
      background-color: ${isDark ? '#1f2937' : '#f9fafb'};
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      margin: 0.5em 0;
    }
    .ProseMirror pre code {
      background: none;
      padding: 0;
    }
    .ProseMirror hr {
      border: none;
      border-top: 2px solid ${isDark ? '#4b5563' : '#d1d5db'};
      margin: 1em 0;
    }
    .ProseMirror a {
      color: #3b82f6;
      text-decoration: underline;
    }
    .ProseMirror strong {
      font-weight: bold;
    }
    .ProseMirror em {
      font-style: italic;
    }
    .ProseMirror u {
      text-decoration: underline;
    }
  `;

  // ✅ Define editor extensions
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        history: { depth: 200 },
      }),
      Underline,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: { class: 'text-blue-500 underline' },
      }),
      Placeholder.configure({ placeholder }),
      HardBreak.configure({ keepMarks: true }),
      Dropcursor,
      Gapcursor,
      Typography,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    [placeholder]
  );

  // ✅ Create editor
  const editor = useEditor(
    {
      extensions,
      autofocus: false,
      content:
        value && typeof value === 'object' && value.type === 'doc'
          ? value
          : { type: 'doc', content: [{ type: 'paragraph' }] },
      onUpdate: ({ editor }) => {
        const json = editor.getJSON();
        onChange?.(json);
      },
      editorProps: {
        attributes: {
          class: `min-h-[200px] p-4 outline-none prose prose-sm max-w-none focus:outline-none ${
            isDark ? 'prose-invert text-white' : 'text-gray-900'
          }`,
        },
      },
    },
    [extensions, isDark]
  );

  // ✅ Sync external `value` updates
  useEffect(() => {
    if (!editor) return;
    
    const currentContent = editor.getJSON();
    const newValue = value && typeof value === 'object' && value.type === 'doc' 
      ? value 
      : { type: 'doc', content: [{ type: 'paragraph' }] };
    
    // Only update if content is actually different
    if (JSON.stringify(currentContent) !== JSON.stringify(newValue)) {
      editor.commands.setContent(newValue, false);
    }
  }, [value, editor]);

  // ✅ Link insertion handler
  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('Enter URL', prev);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  // ✅ Loading placeholder
  if (!editor) {
    return (
      <div
        className={`rounded-lg border ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'
        } min-h-[200px] p-4`}
      >
        Loading editor...
      </div>
    );
  }

  // ✅ Toolbar button component
  const Button = ({ onClick, isActive, disabled, title, children }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-2 rounded transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${
        isActive
          ? isDark
            ? 'bg-gray-700 text-white'
            : 'bg-gray-200 text-gray-900'
          : isDark
          ? 'text-gray-300 hover:bg-gray-700'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );

  // ✅ Final render
  return (
    <>
      <style>{editorStyles}</style>
      <div
        className={`rounded-lg border transition-colors ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'
        }`}
      >
        {/* Toolbar */}
      <div
        className={`flex flex-wrap gap-1 p-2 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-300'
        }`}
      >
        {/* Basic formatting */}
        <Button
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 mx-1 bg-gray-200 dark:bg-gray-700" />

        {/* Paragraph/Normal */}
        <Button
          onClick={() => editor.chain().focus().setParagraph().run()}
          isActive={editor.isActive('paragraph')}
          title="Normal Text"
        >
          <span className="text-xs font-medium">P</span>
        </Button>

        {/* Headings */}
        {[1, 2, 3].map((level) => (
          <Button
            key={level}
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
            isActive={editor.isActive('heading', { level })}
            title={`Heading ${level}`}
          >
            {level === 1 && <Heading1 className="w-4 h-4" />}
            {level === 2 && <Heading2 className="w-4 h-4" />}
            {level === 3 && <Heading3 className="w-4 h-4" />}
          </Button>
        ))}

        <div className="w-px h-6 mx-1 bg-gray-200 dark:bg-gray-700" />

        {/* Lists */}
        <Button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 mx-1 bg-gray-200 dark:bg-gray-700" />

        {/* Alignment */}
        <Button 
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 mx-1 bg-gray-200 dark:bg-gray-700" />

        {/* Link */}
        <Button onClick={setLink} isActive={editor.isActive('link')} title="Insert Link">
          <LinkIcon className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 mx-1 bg-gray-200 dark:bg-gray-700" />

        {/* Advanced formatting */}
        <Button 
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </Button>
        <Button 
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </Button>
        <Button 
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Line"
        >
          <Minus className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 mx-1 bg-gray-200 dark:bg-gray-700" />

        {/* Undo/Redo */}
        <Button onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo className="w-4 h-4" />
        </Button>
        <Button onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo className="w-4 h-4" />
        </Button>

        {/* Clear formatting */}
        <Button
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          title="Clear Formatting"
        >
          <span className="text-xs font-medium">CLR</span>
        </Button>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />
      </div>
    </>
  );
}

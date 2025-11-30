"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Highlighter,
  Undo,
  Redo,
  Type,
  Minus,
  Quote
} from "lucide-react";
import { useEffect, useRef } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const MenuButton = ({ 
  onClick, 
  isActive = false, 
  disabled = false,
  children,
  title
}: { 
  onClick: () => void; 
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
      isActive ? "bg-slate-200 text-blue-600" : "text-slate-600"
    }`}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-6 bg-slate-300 mx-1" />;

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const isExternalUpdate = useRef(false);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
    ],
    content: content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[400px] px-4 py-3",
        style: "font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.6;",
      },
    },
    onUpdate: ({ editor }) => {
      if (!isExternalUpdate.current) {
        // HTML olarak içeriği al
        const html = editor.getHTML();
        onChange(html);
      }
    },
  });

  // Content değiştiğinde editörü güncelle (dışarıdan gelen değişiklikler için)
  useEffect(() => {
    if (editor && content) {
      const currentContent = editor.getHTML();
      // Sadece içerik gerçekten farklıysa güncelle
      if (currentContent !== content) {
        isExternalUpdate.current = true;
        editor.commands.setContent(content);
        isExternalUpdate.current = false;
      }
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="border border-slate-200 rounded-lg bg-white">
        <div className="h-[500px] flex items-center justify-center text-slate-400">
          Editör yükleniyor...
        </div>
      </div>
    );
  }

  // Karakter sayısını hesapla (HTML taglarını çıkar)
  const getCharacterCount = () => {
    return editor.getText().length;
  };

  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-slate-200 bg-slate-50">
        {/* Undo/Redo */}
        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Geri Al (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="İleri Al (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </MenuButton>

        <Divider />

        {/* Heading */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive("heading", { level: 1 })}
          title="Başlık 1"
        >
          <span className="text-xs font-bold">H1</span>
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          title="Başlık 2"
        >
          <span className="text-xs font-bold">H2</span>
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive("heading", { level: 3 })}
          title="Başlık 3"
        >
          <span className="text-xs font-bold">H3</span>
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setParagraph().run()}
          isActive={editor.isActive("paragraph")}
          title="Normal Metin"
        >
          <Type className="h-4 w-4" />
        </MenuButton>

        <Divider />

        {/* Text Formatting */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Kalın (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="İtalik (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          title="Altı Çizili (Ctrl+U)"
        >
          <UnderlineIcon className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          title="Üstü Çizili"
        >
          <Strikethrough className="h-4 w-4" />
        </MenuButton>

        <Divider />

        {/* Text Color */}
        <div className="relative">
          <input
            type="color"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            className="absolute inset-0 opacity-0 cursor-pointer w-8 h-8"
            title="Metin Rengi"
          />
          <div className="p-1.5 rounded hover:bg-slate-200 transition-colors cursor-pointer">
            <div className="h-4 w-4 rounded border border-slate-300 bg-gradient-to-br from-red-500 via-green-500 to-blue-500" />
          </div>
        </div>

        {/* Highlight */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()}
          isActive={editor.isActive("highlight")}
          title="Vurgula"
        >
          <Highlighter className="h-4 w-4" />
        </MenuButton>

        <Divider />

        {/* Text Alignment */}
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          title="Sola Hizala"
        >
          <AlignLeft className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          title="Ortala"
        >
          <AlignCenter className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          title="Sağa Hizala"
        >
          <AlignRight className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          isActive={editor.isActive({ textAlign: "justify" })}
          title="İki Yana Yasla"
        >
          <AlignJustify className="h-4 w-4" />
        </MenuButton>

        <Divider />

        {/* Lists */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Madde İşareti"
        >
          <List className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Numaralı Liste"
        >
          <ListOrdered className="h-4 w-4" />
        </MenuButton>

        <Divider />

        {/* Block Elements */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="Alıntı"
        >
          <Quote className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Yatay Çizgi"
        >
          <Minus className="h-4 w-4" />
        </MenuButton>
      </div>

      {/* Editor Content */}
      <div className="min-h-[450px] max-h-[500px] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
        <span>{getCharacterCount()} karakter</span>
        <span className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-xs">Ctrl+B</kbd> Kalın
          <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-xs">Ctrl+I</kbd> İtalik
          <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-xs">Ctrl+U</kbd> Altı Çizili
        </span>
      </div>
    </div>
  );
}

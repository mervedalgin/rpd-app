"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Link from "@tiptap/extension-link";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Typography from "@tiptap/extension-typography";
import { useEffect, useRef, useState, useCallback } from "react";
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
  Quote,
  Link as LinkIcon,
  Unlink,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
  Table as TableIcon,
  Plus,
  Trash2,
  ChevronDown,
  Maximize2,
  Minimize2,
  Download,
  Copy,
  RotateCcw,
  Palette,
  PaintBucket,
  Rows3,
  Columns3,
  MergeIcon,
  SplitIcon,
  Sparkles
} from "lucide-react";

// ==================== TYPES ====================
interface AdvancedEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  studentName?: string;
  onDownload?: () => void;
  onPreview?: () => void;
  onReset?: () => void;
  onCopy?: () => void;
}

// ==================== FONT SIZES ====================
const FONT_SIZES = ["10px", "11px", "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];
const FONT_FAMILIES = [
  { label: "Times New Roman", value: "Times New Roman, Times, serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Calibri", value: "Calibri, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Tahoma", value: "Tahoma, sans-serif" },
];

const HIGHLIGHT_COLORS = [
  { label: "Sarı", color: "#fef08a" },
  { label: "Yeşil", color: "#bbf7d0" },
  { label: "Mavi", color: "#bfdbfe" },
  { label: "Pembe", color: "#fbcfe8" },
  { label: "Turuncu", color: "#fed7aa" },
  { label: "Mor", color: "#ddd6fe" },
];

const TEXT_COLORS = [
  "#000000", "#374151", "#991b1b", "#9a3412", "#854d0e",
  "#166534", "#1e40af", "#5b21b6", "#9d174d", "#115e59",
  "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#2563eb",
  "#7c3aed", "#db2777", "#0d9488", "#6b7280", "#64748b",
];

// ==================== TOOLBAR BUTTON ====================
function ToolBtn({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title,
  className = "",
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-1.5 rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed
        ${isActive
          ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20 scale-105"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-800 active:scale-95"
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
}

function ToolDivider() {
  return <div className="w-px h-7 bg-gradient-to-b from-transparent via-slate-200 to-transparent mx-1" />;
}

// ==================== DROPDOWN ====================
function Dropdown({
  trigger,
  children,
  title,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative" title={title}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-all"
      >
        {trigger}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50 z-50 min-w-[160px] py-1.5 animate-in fade-in slide-in-from-top-2 duration-150"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ==================== FONT SIZE EXTENSION ====================
// TipTap doesn't have built-in font-size, so we use mark with style
const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize || null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) return {};
          return { style: `font-size: ${attributes.fontSize}` };
        },
      },
    };
  },
});

// ==================== MAIN COMPONENT ====================
export function AdvancedEditor({
  content,
  onChange,
  placeholder = "Tutanak içeriğini düzenleyin...",
  studentName,
  onDownload,
  onPreview,
  onReset,
  onCopy,
}: AdvancedEditorProps) {
  const isExternalUpdate = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorWrapperRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      FontSize,
      Color,
      FontFamily.configure({ types: ["textStyle"] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-blue-600 underline" } }),
      Superscript,
      Subscript,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder }),
      CharacterCount,
      Typography,
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[500px] px-6 py-4",
        style: "font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.8;",
      },
    },
    onUpdate: ({ editor }) => {
      if (!isExternalUpdate.current) {
        onChange(editor.getHTML());
      }
    },
  });

  useEffect(() => {
    if (editor && content) {
      const currentContent = editor.getHTML();
      if (currentContent !== content) {
        isExternalUpdate.current = true;
        editor.commands.setContent(content);
        isExternalUpdate.current = false;
      }
    }
  }, [content, editor]);

  const setFontSize = useCallback(
    (size: string) => {
      editor?.chain().focus().setMark("textStyle", { fontSize: size }).run();
    },
    [editor]
  );

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Bağlantı URL:", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // ESC to exit fullscreen
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isFullscreen]);

  if (!editor) {
    return (
      <div className="border border-slate-200 rounded-2xl bg-white">
        <div className="h-[600px] flex items-center justify-center text-slate-400">
          <Sparkles className="h-5 w-5 animate-spin mr-2" />
          Gelişmiş editör yükleniyor...
        </div>
      </div>
    );
  }

  const charCount = editor.storage.characterCount?.characters() ?? editor.getText().length;
  const wordCount = editor.getText().split(/\s+/).filter(Boolean).length;

  const wrapperClass = isFullscreen
    ? "fixed inset-0 z-50 bg-white flex flex-col"
    : "border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm";

  return (
    <div ref={editorWrapperRef} className={wrapperClass}>
      {/* ==================== TOOLBAR ==================== */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        {/* Row 1: Main formatting */}
        <div className="flex flex-wrap items-center gap-0.5 px-3 py-2">
          {/* Undo / Redo */}
          <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Geri Al (Ctrl+Z)">
            <Undo className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="İleri Al (Ctrl+Y)">
            <Redo className="h-4 w-4" />
          </ToolBtn>

          <ToolDivider />

          {/* Font Family */}
          <Dropdown trigger={<span className="text-xs font-medium truncate max-w-[100px]">{FONT_FAMILIES.find((f) => editor.isActive("textStyle", { fontFamily: f.value }))?.label || "Times New Roman"}</span>} title="Yazı Tipi">
            {FONT_FAMILIES.map((f) => (
              <button
                key={f.value}
                onClick={() => editor.chain().focus().setFontFamily(f.value).run()}
                className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors ${editor.isActive("textStyle", { fontFamily: f.value }) ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-700"}`}
                style={{ fontFamily: f.value }}
              >
                {f.label}
              </button>
            ))}
          </Dropdown>

          {/* Font Size */}
          <Dropdown trigger={<span className="text-xs font-medium">12px</span>} title="Yazı Boyutu">
            {FONT_SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setFontSize(s)}
                className="block w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 text-slate-700 transition-colors"
              >
                {s}
              </button>
            ))}
          </Dropdown>

          <ToolDivider />

          {/* Headings */}
          <Dropdown
            trigger={
              <span className="text-xs font-bold">
                {editor.isActive("heading", { level: 1 }) ? "H1" : editor.isActive("heading", { level: 2 }) ? "H2" : editor.isActive("heading", { level: 3 }) ? "H3" : "P"}
              </span>
            }
            title="Paragraf Stili"
          >
            <button onClick={() => editor.chain().focus().setParagraph().run()} className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 ${editor.isActive("paragraph") ? "bg-indigo-50 text-indigo-700" : "text-slate-700"}`}>
              <Type className="h-3.5 w-3.5 inline mr-2" />Normal Metin
            </button>
            {[1, 2, 3].map((level) => (
              <button
                key={level}
                onClick={() => editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run()}
                className={`block w-full text-left px-3 py-1.5 hover:bg-slate-50 ${editor.isActive("heading", { level }) ? "bg-indigo-50 text-indigo-700" : "text-slate-700"}`}
                style={{ fontSize: `${18 - level * 2}px`, fontWeight: "bold" }}
              >
                Başlık {level}
              </button>
            ))}
          </Dropdown>

          <ToolDivider />

          {/* Bold / Italic / Underline / Strike */}
          <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} title="Kalın (Ctrl+B)">
            <Bold className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} title="İtalik (Ctrl+I)">
            <Italic className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} title="Altı Çizili (Ctrl+U)">
            <UnderlineIcon className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} title="Üstü Çizili">
            <Strikethrough className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editor.isActive("superscript")} title="Üst Simge">
            <SuperscriptIcon className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editor.isActive("subscript")} title="Alt Simge">
            <SubscriptIcon className="h-4 w-4" />
          </ToolBtn>

          <ToolDivider />

          {/* Text Color */}
          <Dropdown trigger={<><Palette className="h-4 w-4" /></>} title="Metin Rengi">
            <div className="grid grid-cols-5 gap-1 p-2">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => editor.chain().focus().setColor(c).run()}
                  className="w-6 h-6 rounded-md border border-slate-200 hover:scale-125 transition-transform"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <button onClick={() => editor.chain().focus().unsetColor().run()} className="block w-full text-left px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 border-t border-slate-100">
              Rengi Kaldır
            </button>
          </Dropdown>

          {/* Highlight */}
          <Dropdown trigger={<><PaintBucket className="h-4 w-4" /></>} title="Vurgulama">
            <div className="flex gap-1 p-2">
              {HIGHLIGHT_COLORS.map((h) => (
                <button
                  key={h.color}
                  onClick={() => editor.chain().focus().toggleHighlight({ color: h.color }).run()}
                  className="w-7 h-7 rounded-lg border border-slate-200 hover:scale-110 transition-transform flex items-center justify-center text-xs"
                  style={{ backgroundColor: h.color }}
                  title={h.label}
                >
                  A
                </button>
              ))}
            </div>
            <button onClick={() => editor.chain().focus().unsetHighlight().run()} className="block w-full text-left px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 border-t border-slate-100">
              Vurguyu Kaldır
            </button>
          </Dropdown>

          <ToolDivider />

          {/* Alignment */}
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} isActive={editor.isActive({ textAlign: "left" })} title="Sola Hizala">
            <AlignLeft className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} isActive={editor.isActive({ textAlign: "center" })} title="Ortala">
            <AlignCenter className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} isActive={editor.isActive({ textAlign: "right" })} title="Sağa Hizala">
            <AlignRight className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign("justify").run()} isActive={editor.isActive({ textAlign: "justify" })} title="İki Yana Yasla">
            <AlignJustify className="h-4 w-4" />
          </ToolBtn>

          <ToolDivider />

          {/* Lists */}
          <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} title="Madde İşareti">
            <List className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} title="Numaralı Liste">
            <ListOrdered className="h-4 w-4" />
          </ToolBtn>

          <ToolDivider />

          {/* Block elements */}
          <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} title="Alıntı">
            <Quote className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Yatay Çizgi">
            <Minus className="h-4 w-4" />
          </ToolBtn>

          {/* Link */}
          <ToolBtn onClick={setLink} isActive={editor.isActive("link")} title="Bağlantı Ekle">
            <LinkIcon className="h-4 w-4" />
          </ToolBtn>
          {editor.isActive("link") && (
            <ToolBtn onClick={() => editor.chain().focus().unsetLink().run()} title="Bağlantıyı Kaldır">
              <Unlink className="h-4 w-4" />
            </ToolBtn>
          )}

          <ToolDivider />

          {/* Table */}
          <Dropdown trigger={<><TableIcon className="h-4 w-4" /></>} title="Tablo">
            <button onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className="block w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
              <Plus className="h-3.5 w-3.5 inline mr-2" />3x3 Tablo Ekle
            </button>
            <button onClick={() => editor.chain().focus().insertTable({ rows: 4, cols: 4, withHeaderRow: true }).run()} className="block w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
              <Plus className="h-3.5 w-3.5 inline mr-2" />4x4 Tablo Ekle
            </button>
            {editor.can().addColumnAfter() && (
              <>
                <div className="border-t border-slate-100 my-1" />
                <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="block w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                  <Columns3 className="h-3.5 w-3.5 inline mr-2" />Sütun Ekle
                </button>
                <button onClick={() => editor.chain().focus().addRowAfter().run()} className="block w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                  <Rows3 className="h-3.5 w-3.5 inline mr-2" />Satır Ekle
                </button>
                <button onClick={() => editor.chain().focus().deleteColumn().run()} className="block w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                  <Columns3 className="h-3.5 w-3.5 inline mr-2" />Sütun Sil
                </button>
                <button onClick={() => editor.chain().focus().deleteRow().run()} className="block w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                  <Rows3 className="h-3.5 w-3.5 inline mr-2" />Satır Sil
                </button>
                <button onClick={() => editor.chain().focus().deleteTable().run()} className="block w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5 inline mr-2" />Tabloyu Sil
                </button>
              </>
            )}
          </Dropdown>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Actions */}
          {onReset && (
            <ToolBtn onClick={onReset} title="Sıfırla" className="text-slate-400">
              <RotateCcw className="h-4 w-4" />
            </ToolBtn>
          )}
          {onCopy && (
            <ToolBtn onClick={onCopy} title="Kopyala" className="text-slate-400">
              <Copy className="h-4 w-4" />
            </ToolBtn>
          )}
          <ToolBtn onClick={toggleFullscreen} title={isFullscreen ? "Küçült (Esc)" : "Tam Ekran"}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </ToolBtn>
          {onPreview && (
            <button
              onClick={onPreview}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-700 text-sm font-medium hover:bg-indigo-50 active:scale-[0.98] transition-all"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Önizle</span>
            </button>
          )}
          {onDownload && (
            <button
              onClick={onDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium shadow-md shadow-indigo-500/20 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">DOCX İndir</span>
            </button>
          )}
        </div>
      </div>

      {/* ==================== EDITOR CONTENT ==================== */}
      <div className={`overflow-y-auto bg-white ${isFullscreen ? "flex-1" : "min-h-[550px] max-h-[650px]"}`}>
        <div className="max-w-4xl mx-auto">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* ==================== FOOTER ==================== */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-gradient-to-r from-slate-50 to-white text-xs text-slate-400">
        <div className="flex items-center gap-4">
          {studentName && <span className="font-medium text-slate-600">{studentName}</span>}
          <span>{charCount} karakter</span>
          <span>{wordCount} kelime</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono">Ctrl+B</kbd> Kalın
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono">Ctrl+I</kbd> İtalik
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono">Ctrl+U</kbd> Altı Çizili
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono">Ctrl+Z</kbd> Geri Al
          </span>
          {isFullscreen && <span className="text-slate-500">ESC ile çık</span>}
        </div>
      </div>
    </div>
  );
}

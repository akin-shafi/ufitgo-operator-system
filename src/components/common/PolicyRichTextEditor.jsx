import { useEffect } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote, Redo2, Underline as UnderlineIcon, Undo2 } from "lucide-react"

function legacyTextToHtml(content) {
  return content.split(/\n{2,}/).map((paragraph) => `<p>${paragraph.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</p>`).join("")
}

export function PolicyRichTextEditor({ value, contentFormat, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } }), Link.configure({ openOnClick: false }), Underline],
    content: contentFormat === "rich_text" ? value : legacyTextToHtml(value),
    editorProps: { attributes: { class: "min-h-72 px-3 py-3 text-base leading-7 text-fg outline-none" } },
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  })

  useEffect(() => {
    if (editor && contentFormat === "rich_text" && value !== editor.getHTML()) editor.commands.setContent(value, { emitUpdate: false })
  }, [editor, value, contentFormat])

  if (!editor) return null
  const tool = (label, run, active, Icon) => <button type="button" title={label} aria-label={label} onMouseDown={(event) => event.preventDefault()} onClick={run} className={`grid size-11 shrink-0 place-items-center rounded-md ${active ? "bg-primary text-white" : "text-fg/75 active:bg-bg hover:bg-bg"}`}><Icon size={18} /></button>

  return <div className="mt-2 overflow-hidden rounded-lg border border-border bg-bg focus-within:border-primary"><div className="flex gap-1 overflow-x-auto border-b border-border bg-card p-1.5">{tool("Undo", () => editor.chain().focus().undo().run(), false, Undo2)}{tool("Redo", () => editor.chain().focus().redo().run(), false, Redo2)}{tool("Bold", () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"), Bold)}{tool("Italic", () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"), Italic)}{tool("Underline", () => editor.chain().focus().toggleUnderline().run(), editor.isActive("underline"), UnderlineIcon)}{tool("Heading", () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }), Heading2)}{tool("Subheading", () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive("heading", { level: 3 }), Heading3)}{tool("Bulleted list", () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"), List)}{tool("Numbered list", () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"), ListOrdered)}{tool("Quote", () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"), Quote)}{tool("Add link", () => { const href = window.prompt("Link URL"); if (href) editor.chain().focus().extendMarkRange("link").setLink({ href }).run() }, editor.isActive("link"), Link2)}</div><EditorContent editor={editor} /></div>
}
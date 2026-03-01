import { useState, useRef, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  Columns3,
  CircleDot,
  Clock,
  CheckCircle2,
  Plus,
  GripVertical,
  Flag,
  Calendar,
  X,
  Trash2,
} from 'lucide-react';
import type { KanbanCard, KanbanColumnId, KanbanPriority, KanbanTag } from '../types';

// ─── Constants ───────────────────────────────────────────────────────────────

const COLUMNS: { id: KanbanColumnId; label: string; icon: typeof CircleDot }[] = [
  { id: 'todo', label: 'À faire', icon: CircleDot },
  { id: 'in-progress', label: 'En cours', icon: Clock },
  { id: 'done', label: 'Terminé', icon: CheckCircle2 },
];

const PRIORITY_CONFIG: Record<KanbanPriority, { label: string; color: string; bg: string }> = {
  haute: { label: 'Haute', color: 'text-red-500', bg: 'bg-red-500/10' },
  moyenne: { label: 'Moyenne', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  basse: { label: 'Basse', color: 'text-green-500', bg: 'bg-green-500/10' },
};

const TAG_COLORS = [
  '#3b82f6', // bleu
  '#8b5cf6', // violet
  '#ec4899', // rose
  '#f97316', // orange
  '#22c55e', // vert
  '#14b8a6', // teal
];

// ─── KanbanCardItem ──────────────────────────────────────────────────────────

function KanbanCardItem({
  card,
  onClick,
}: {
  card: KanbanCard;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { card } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-xl bg-surface p-4 shadow-sm border border-border apple-transition cursor-pointer ${
        isDragging ? 'opacity-50' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-0.5 opacity-0 group-hover:opacity-60 hover:!opacity-100 cursor-grab active:cursor-grabbing text-text-muted shrink-0"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} strokeWidth={1.5} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-text truncate">{card.title}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${PRIORITY_CONFIG[card.priority].bg} ${PRIORITY_CONFIG[card.priority].color}`}>
              <Flag size={9} />
              {PRIORITY_CONFIG[card.priority].label}
            </span>
            {card.tags.map((tag, i) => (
              <span
                key={i}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-md text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.label}
              </span>
            ))}
            {card.dueDate && (
              <span className="inline-flex items-center gap-1 text-[10px] text-text-muted">
                <Calendar size={9} />
                {new Date(card.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── KanbanColumn ────────────────────────────────────────────────────────────

function KanbanColumn({
  column,
  cards,
  isOver,
  onAddCard,
  onClickCard,
}: {
  column: (typeof COLUMNS)[number];
  cards: KanbanCard[];
  isOver: boolean;
  onAddCard: (title: string) => void;
  onClickCard: (card: KanbanCard) => void;
}) {
  const { setNodeRef } = useDroppable({ id: column.id });
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = column.icon;

  useEffect(() => {
    if (isAdding) inputRef.current?.focus();
  }, [isAdding]);

  const handleSubmit = () => {
    const trimmed = newTitle.trim();
    if (trimmed) {
      onAddCard(trimmed);
    }
    setNewTitle('');
    setIsAdding(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[85vw] sm:min-w-[260px] max-w-[85vw] sm:max-w-[360px] snap-center rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] p-3 flex flex-col gap-2 apple-transition ${
        isOver ? 'ring-2 ring-accent/20' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4">
        <Icon size={14} strokeWidth={1.5} className="text-text-muted" />
        <span className="text-[12px] font-semibold text-text uppercase tracking-wide">{column.label}</span>
        <span className="ml-auto text-[11px] font-medium text-text-muted bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 rounded-md">
          {cards.length}
        </span>
        <button
          onClick={() => setIsAdding(true)}
          className="p-1 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 apple-transition cursor-pointer"
        >
          <Plus size={14} strokeWidth={1.5} />
        </button>
      </div>

      {/* Cards */}
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 min-h-[60px]">
          {cards.map((card) => (
            <KanbanCardItem key={card.id} card={card} onClick={() => onClickCard(card)} />
          ))}
        </div>
      </SortableContext>

      {/* Inline add */}
      {isAdding && (
        <input
          ref={inputRef}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
            if (e.key === 'Escape') { setNewTitle(''); setIsAdding(false); }
          }}
          onBlur={handleSubmit}
          placeholder="Titre de la carte..."
          className="w-full px-3 py-2 text-[13px] rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      )}
    </div>
  );
}

// ─── CardEditModal ───────────────────────────────────────────────────────────

function CardEditModal({
  card,
  onSave,
  onDelete,
  onClose,
}: {
  card: KanbanCard;
  onSave: (fields: Partial<Pick<KanbanCard, 'title' | 'description' | 'priority' | 'tags' | 'dueDate'>>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [priority, setPriority] = useState<KanbanPriority>(card.priority);
  const [dueDate, setDueDate] = useState(card.dueDate ?? '');
  const [tags, setTags] = useState<KanbanTag[]>(card.tags);
  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleSave = useCallback(() => {
    onSave({
      title: title.trim() || card.title,
      description,
      priority,
      tags,
      dueDate: dueDate || null,
    });
    onClose();
  }, [title, description, priority, tags, dueDate, card.title, onSave, onClose]);

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete();
      onClose();
    } else {
      setConfirmDelete(true);
      deleteTimerRef.current = setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  useEffect(() => {
    return () => { if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current); };
  }, []);

  const addTag = () => {
    const trimmed = newTagLabel.trim();
    if (trimmed) {
      setTags((prev) => [...prev, { label: trimmed, color: newTagColor }]);
      setNewTagLabel('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 modal-backdrop" onClick={handleSave} />
      <div className="modal-content relative w-full max-w-lg bg-surface rounded-3xl flex flex-col overflow-hidden" style={{ boxShadow: 'var(--shadow-modal)' }}>
        <div className="p-6 flex flex-col gap-5">
          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre"
            className="text-[16px] font-semibold text-text bg-transparent border-b border-border pb-2 focus:outline-none focus:border-accent apple-transition w-full"
          />

          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description..."
            rows={3}
            className="text-[13px] text-text bg-black/[0.02] dark:bg-white/[0.03] rounded-xl p-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none w-full"
          />

          {/* Priority */}
          <div>
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2 block">Priorité</label>
            <div className="flex gap-2">
              {(Object.entries(PRIORITY_CONFIG) as [KanbanPriority, typeof PRIORITY_CONFIG.haute][]).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setPriority(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg apple-transition cursor-pointer border ${
                    priority === key
                      ? `${config.bg} ${config.color} border-current`
                      : 'border-border text-text-muted hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <Flag size={11} />
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2 block">Date limite</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="text-[13px] text-text bg-black/[0.02] dark:bg-white/[0.03] rounded-xl px-3 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent/30 w-full"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2 block">Tags</label>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg text-white"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.label}
                    <button onClick={() => setTags((prev) => prev.filter((_, idx) => idx !== i))} className="hover:opacity-70 cursor-pointer">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                value={newTagLabel}
                onChange={(e) => setNewTagLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addTag(); }}
                placeholder="Nouveau tag..."
                className="flex-1 text-[12px] px-3 py-1.5 rounded-lg border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <div className="flex gap-1">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewTagColor(color)}
                    className={`w-5 h-5 rounded-full cursor-pointer apple-transition ${
                      newTagColor === color ? 'ring-2 ring-offset-2 ring-offset-surface ring-accent scale-110' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <button
                onClick={addTag}
                className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 apple-transition cursor-pointer"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <button
            onClick={handleDelete}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg apple-transition cursor-pointer ${
              confirmDelete
                ? 'bg-danger/20 text-danger'
                : 'text-text-muted hover:text-danger hover:bg-danger/10'
            }`}
          >
            <Trash2 size={13} />
            {confirmDelete ? 'Confirmer' : 'Supprimer'}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-[13px] font-medium rounded-xl bg-accent text-white hover:bg-accent/90 apple-transition cursor-pointer"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DragOverlayCard ─────────────────────────────────────────────────────────

function DragOverlayCard({ card }: { card: KanbanCard }) {
  return (
    <div className="rounded-xl bg-surface p-4 shadow-lg border border-border rotate-2 w-[280px]">
      <p className="text-[13px] font-medium text-text truncate">{card.title}</p>
      <div className="flex items-center gap-2 mt-2">
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${PRIORITY_CONFIG[card.priority].bg} ${PRIORITY_CONFIG[card.priority].color}`}>
          <Flag size={9} />
          {PRIORITY_CONFIG[card.priority].label}
        </span>
      </div>
    </div>
  );
}

// ─── KanbanView (main) ──────────────────────────────────────────────────────

interface KanbanViewProps {
  cards: KanbanCard[];
  onAddCard: (title: string, column: KanbanColumnId) => void;
  onUpdateCard: (cardId: string, fields: Partial<Pick<KanbanCard, 'title' | 'description' | 'priority' | 'tags' | 'dueDate'>>) => void;
  onMoveCard: (cardId: string, toColumn: KanbanColumnId, newOrder: number) => void;
  onDeleteCard: (cardId: string) => void;
}

export default function KanbanView({ cards, onAddCard, onUpdateCard, onMoveCard, onDeleteCard }: KanbanViewProps) {
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const getColumnCards = (columnId: KanbanColumnId) =>
    cards.filter((c) => c.column === columnId).sort((a, b) => a.order - b.order);

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards.find((c) => c.id === event.active.id);
    if (card) setActiveCard(card);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeCardData = cards.find((c) => c.id === active.id);
    if (!activeCardData) return;

    // Determine target column
    let targetColumn: KanbanColumnId;
    const overCard = cards.find((c) => c.id === over.id);
    if (overCard) {
      targetColumn = overCard.column;
    } else if (COLUMNS.some((col) => col.id === over.id)) {
      targetColumn = over.id as KanbanColumnId;
    } else {
      return;
    }

    if (activeCardData.column !== targetColumn) {
      const targetCards = getColumnCards(targetColumn);
      const newOrder = targetCards.length > 0
        ? targetCards[targetCards.length - 1].order + 1
        : Date.now();
      onMoveCard(activeCardData.id, targetColumn, newOrder);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const draggedCard = cards.find((c) => c.id === active.id);
    if (!draggedCard) return;

    // Determine target column
    let targetColumn: KanbanColumnId;
    const overCard = cards.find((c) => c.id === over.id);
    if (overCard) {
      targetColumn = overCard.column;
    } else if (COLUMNS.some((col) => col.id === over.id)) {
      targetColumn = over.id as KanbanColumnId;
    } else {
      return;
    }

    const columnCards = getColumnCards(targetColumn).filter((c) => c.id !== draggedCard.id);

    if (overCard && overCard.id !== draggedCard.id) {
      const overIndex = columnCards.findIndex((c) => c.id === overCard.id);
      let newOrder: number;
      if (overIndex === 0) {
        newOrder = columnCards[0].order - 1;
      } else {
        newOrder = (columnCards[overIndex - 1].order + columnCards[overIndex].order) / 2;
      }
      onMoveCard(draggedCard.id, targetColumn, newOrder);
    } else if (columnCards.length === 0) {
      onMoveCard(draggedCard.id, targetColumn, Date.now());
    }
  };

  const [overColumnId, setOverColumnId] = useState<KanbanColumnId | null>(null);

  const handleDragOverWithHighlight = (event: DragOverEvent) => {
    handleDragOver(event);
    const { over } = event;
    if (!over) { setOverColumnId(null); return; }
    const overCard = cards.find((c) => c.id === over.id);
    if (overCard) {
      setOverColumnId(overCard.column);
    } else if (COLUMNS.some((col) => col.id === over.id)) {
      setOverColumnId(over.id as KanbanColumnId);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4">
        <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center">
          <Columns3 size={16} strokeWidth={1.5} className="text-accent" />
        </div>
        <h2 className="text-[15px] font-semibold text-text">Kanban</h2>
        {cards.length > 0 && (
          <span className="text-[11px] font-medium text-text-muted bg-black/[0.04] dark:bg-white/[0.06] px-2 py-0.5 rounded-md">
            {cards.length} carte{cards.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto px-4 sm:px-6 pb-4 sm:pb-6 snap-x snap-mandatory lg:snap-none">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOverWithHighlight}
          onDragEnd={(e) => { handleDragEnd(e); setOverColumnId(null); }}
        >
          <div className="flex gap-4 h-full">
            {COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                cards={getColumnCards(column.id)}
                isOver={overColumnId === column.id}
                onAddCard={(title) => onAddCard(title, column.id)}
                onClickCard={(card) => setEditingCard(card)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeCard ? <DragOverlayCard card={activeCard} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Edit modal */}
      {editingCard && (
        <CardEditModal
          card={editingCard}
          onSave={(fields) => onUpdateCard(editingCard.id, fields)}
          onDelete={() => onDeleteCard(editingCard.id)}
          onClose={() => setEditingCard(null)}
        />
      )}
    </div>
  );
}

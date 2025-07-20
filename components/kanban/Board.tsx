
'use client'

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'; // Using @hello-pangea/dnd for broader compatibility
import { Card as ShadcnCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Card {
  id: string;
  title: string;
  content: string;
}

interface Column {
  id: string;
  title: string;
  cardIds: string[];
}

interface BoardData {
  cards: Record<string, Card>;
  columns: Record<string, Column>;
  columnOrder: string[];
}

const initialData: BoardData = {
  cards: {
    'card-1': { id: 'card-1', title: 'Task 1', content: 'Description for task 1' },
    'card-2': { id: 'card-2', title: 'Task 2', content: 'Description for task 2' },
    'card-3': { id: 'card-3', title: 'Task 3', content: 'Description for task 3' },
    'card-4': { id: 'card-4', title: 'Task 4', content: 'Description for task 4' },
  },
  columns: {
    'column-1': {
      id: 'column-1',
      title: 'To Do',
      cardIds: ['card-1', 'card-2'],
    },
    'column-2': {
      id: 'column-2',
      title: 'In Progress',
      cardIds: ['card-3'],
    },
    'column-3': {
      id: 'column-3',
      title: 'Done',
      cardIds: ['card-4'],
    },
  },
  columnOrder: ['column-1', 'column-2', 'column-3'],
};

const CardComponent: React.FC<{ card: Card; index: number }> = ({ card, index }) => {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided) => (
        <ShadcnCard
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="p-3 mb-3 bg-card shadow-sm rounded-md"
        >
          <h3 className="font-semibold text-card-foreground">{card.title}</h3>
          <p className="text-sm text-muted-foreground">{card.content}</p>
        </ShadcnCard>
      )}
    </Draggable>
  );
};

const ColumnComponent: React.FC<{ column: Column; cards: Card[] }> = ({ column, cards }) => {
  const [newCardTitle, setNewCardTitle] = useState('');

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      // This will be handled by the Board component's state update
      console.log(`Add card "${newCardTitle}" to column ${column.id}`);
      setNewCardTitle('');
    }
  };

  return (
    <div className="flex flex-col w-80 bg-muted rounded-lg shadow-md p-4 mr-4">
      <h2 className="text-lg font-bold text-muted-foreground mb-4">{column.title}</h2>
      <Droppable droppableId={column.id} type="card">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex-1 min-h-[100px] p-2"
          >
            {cards.map((card, index) => (
              <CardComponent key={card.id} card={card} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <div className="mt-4 flex items-center space-x-2">
        <Input
          placeholder="New card title"
          value={newCardTitle}
          onChange={(e) => setNewCardTitle(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleAddCard}>Add Card</Button>
      </div>
    </div>
  );
};

export default function Board() {
  const [boardData, setBoardData] = useState<BoardData>(initialData);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (type === 'column') {
      const newColumnOrder = Array.from(boardData.columnOrder);
      newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, draggableId);

      setBoardData({
        ...boardData,
        columnOrder: newColumnOrder,
      });
      return;
    }

    const start = boardData.columns[source.droppableId];
    const finish = boardData.columns[destination.droppableId];

    // Moving within the same column
    if (start === finish) {
      const newCardIds = Array.from(start.cardIds);
      newCardIds.splice(source.index, 1);
      newCardIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...start,
        cardIds: newCardIds,
      };

      setBoardData({
        ...boardData,
        columns: {
          ...boardData.columns,
          [newColumn.id]: newColumn,
        },
      });
      return;
    }

    // Moving from one column to another
    const startCardIds = Array.from(start.cardIds);
    startCardIds.splice(source.index, 1);
    const newStart = {
      ...start,
      cardIds: startCardIds,
    };

    const finishCardIds = Array.from(finish.cardIds);
    finishCardIds.splice(destination.index, 0, draggableId);
    const newFinish = {
      ...finish,
      cardIds: finishCardIds,
    };

    setBoardData({
      ...boardData,
      columns: {
        ...boardData.columns,
        [newStart.id]: newStart,
        [newFinish.id]: newFinish,
      },
    });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="all-columns" direction="horizontal" type="column">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="flex p-4 overflow-x-auto"
          >
            {boardData.columnOrder.map((columnId, index) => {
              const column = boardData.columns[columnId];
              const cards = column.cardIds.map((cardId) => boardData.cards[cardId]);

              return (
                <Draggable key={column.id} draggableId={column.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <ColumnComponent column={column} cards={cards} />
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}


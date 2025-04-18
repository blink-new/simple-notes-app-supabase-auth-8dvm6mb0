
import { useState } from 'react';
import { Header } from './Header';
import { NotesList } from './NotesList';
import { NoteEditor } from './NoteEditor';
import { Note } from '../lib/supabase';
import { Plus } from 'lucide-react';
import { Button } from './ui/button';

export function NotesApp() {
  const [selectedNote, setSelectedNote] = useState<Note | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setIsEditing(true);
  };

  const handleNewNote = () => {
    setSelectedNote(undefined);
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    setSelectedNote(undefined);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedNote(undefined);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        {isEditing ? (
          <NoteEditor 
            note={selectedNote} 
            onSave={handleSave} 
            onCancel={handleCancel} 
          />
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your Notes</h2>
              <Button onClick={handleNewNote}>
                <Plus className="h-4 w-4 mr-1" /> New Note
              </Button>
            </div>
            <NotesList onEdit={handleEditNote} onNew={handleNewNote} />
          </div>
        )}
      </main>
    </div>
  );
}
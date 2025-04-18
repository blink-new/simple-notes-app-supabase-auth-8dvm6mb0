
import { useState } from 'react';
import { Header } from './Header';
import { NotesList } from './NotesList';
import { NoteEditor } from './NoteEditor';
import { Note } from '../lib/supabase';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Category } from '../lib/categories';

export function NotesApp() {
  const [selectedNote, setSelectedNote] = useState<Note | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleEditNote = (note: Note & { categories?: Category }) => {
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
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
        {isEditing ? (
          <div className="animate-fade-in">
            <NoteEditor 
              note={selectedNote} 
              onSave={handleSave} 
              onCancel={handleCancel} 
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Your Notes
              </h2>
              <Button 
                onClick={handleNewNote}
                className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" /> New Note
              </Button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-muted shadow-sm"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <Filter className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
            
            <NotesList 
              onEdit={handleEditNote} 
              onNew={handleNewNote} 
              searchQuery={searchQuery}
            />
          </div>
        )}
      </main>
      
      <footer className="border-t py-4 text-center text-sm text-muted-foreground bg-card">
        <div className="container mx-auto">
          Notely — Your ideas, organized beautifully
        </div>
      </footer>
    </div>
  );
}
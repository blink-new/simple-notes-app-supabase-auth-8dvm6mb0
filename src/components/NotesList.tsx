
import { useState, useEffect } from 'react';
import { getNotes, deleteNote } from '../lib/notes';
import { Note } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Trash2, Edit, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface NotesListProps {
  onEdit: (note: Note) => void;
  onNew: () => void;
}

export function NotesList({ onEdit, onNew }: NotesListProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNotes();
      setNotes(data);
    } catch (error: any) {
      console.error('Error fetching notes:', error);
      setError(error.message || 'Failed to load notes');
      
      // Provide more specific error messages
      if (error.message.includes('not logged in') || error.message.includes('JWT')) {
        toast.error('Authentication error. Please sign in again.');
      } else {
        toast.error(error.message || 'Failed to load notes');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNote(id);
      setNotes(notes.filter(note => note.id !== id));
      toast.success('Note deleted successfully');
    } catch (error: any) {
      console.error('Error deleting note:', error);
      
      // Provide more specific error messages
      if (error.message.includes('not logged in') || error.message.includes('JWT')) {
        toast.error('Authentication error. Please sign in again.');
      } else if (error.code === 'PGRST116') {
        toast.error('You do not have permission to delete this note.');
      } else {
        toast.error(error.message || 'Failed to delete note');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map(i => (
          <Card key={i} className="w-full animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-5 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-1/4 mt-1"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-2/3 mt-2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-destructive mb-2">Error loading notes</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchNotes}>
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">No notes yet</h3>
        <p className="text-muted-foreground mb-4">Create your first note to get started</p>
        <Button onClick={onNew} className="bg-primary hover:bg-primary/90 transition-colors">
          <Plus className="mr-2 h-4 w-4" /> New Note
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <Card key={note.id} className="group hover:shadow-md transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">{note.title}</CardTitle>
            <CardDescription>
              {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground line-clamp-2">
              {note.content || 'No content'}
            </p>
          </CardContent>
          <CardFooter className="justify-end pt-0 gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(note)} 
              className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => handleDelete(note.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
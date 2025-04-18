
import { useState, useEffect } from 'react';
import { getNotes, deleteNote, getCategories } from '../lib/notes';
import { Note, Category } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Trash2, Edit, Plus, RefreshCw, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from './ui/badge';

interface NotesListProps {
  onEdit: (note: Note & { categories?: Category }) => void;
  onNew: () => void;
}

export function NotesList({ onEdit, onNew }: NotesListProps) {
  const [notes, setNotes] = useState<(Note & { categories?: Category })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch categories and notes in parallel
      const [notesData, categoriesData] = await Promise.all([
        getNotes(),
        getCategories()
      ]);
      
      setNotes(notesData);
      setCategories(categoriesData);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message || 'Failed to load data');
      
      // Provide more specific error messages
      if (error.message?.includes('not logged in') || error.message?.includes('JWT')) {
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
      if (error.message?.includes('not logged in') || error.message?.includes('JWT')) {
        toast.error('Authentication error. Please sign in again.');
      } else if (error.code === 'PGRST116') {
        toast.error('You do not have permission to delete this note.');
      } else {
        toast.error(error.message || 'Failed to delete note');
      }
    }
  };

  // Helper function to get category by ID
  const getCategoryById = (id: string) => {
    return categories.find(cat => cat.id === id);
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
        <Button onClick={fetchData}>
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
      {notes.map((note) => {
        const category = note.categories || getCategoryById(note.category_id);
        
        return (
          <Card key={note.id} className="group hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{note.title}</CardTitle>
                {category && (
                  <Badge 
                    style={{ 
                      backgroundColor: category.color,
                      color: getBrightness(category.color) > 160 ? '#000' : '#fff'
                    }}
                    className="ml-2"
                  >
                    <Tag className="h-3 w-3 mr-1" /> {category.name}
                  </Badge>
                )}
              </div>
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
        );
      })}
    </div>
  );
}

// Helper function to determine if text should be light or dark based on background color
function getBrightness(hexColor: string): number {
  // Remove # if present
  hexColor = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hexColor.substr(0, 2), 16);
  const g = parseInt(hexColor.substr(2, 2), 16);
  const b = parseInt(hexColor.substr(4, 2), 16);
  
  // Calculate brightness using the formula: (0.299*R + 0.587*G + 0.114*B)
  return (0.299 * r + 0.587 * g + 0.114 * b);
}
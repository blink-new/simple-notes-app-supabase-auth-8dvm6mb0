
import { useState, useEffect } from 'react';
import { getNotes, deleteNote } from '../lib/notes';
import { getCategories } from '../lib/categories';
import { Note } from '../lib/supabase';
import { Category } from '../lib/categories';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Trash2, Edit, Plus, RefreshCw, Tag, Clock, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';

interface NotesListProps {
  onEdit: (note: Note & { categories?: Category }) => void;
  onNew: () => void;
  searchQuery?: string;
}

export function NotesList({ onEdit, onNew, searchQuery = '' }: NotesListProps) {
  const [notes, setNotes] = useState<(Note & { categories?: Category })[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<(Note & { categories?: Category })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredNotes(notes);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredNotes(
        notes.filter(note => 
          note.title.toLowerCase().includes(query) || 
          (note.content && note.content.toLowerCase().includes(query))
        )
      );
    }
  }, [searchQuery, notes]);

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
      setFilteredNotes(notesData);
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
      setFilteredNotes(filteredNotes.filter(note => note.id !== id));
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="overflow-hidden border border-muted/40">
            <CardHeader className="pb-2 space-y-2">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-0">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-12 border-dashed border-2 border-muted">
        <CardContent className="space-y-4">
          <h3 className="text-lg font-medium text-destructive">Error loading notes</h3>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={fetchData} variant="outline" className="mt-2">
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (filteredNotes.length === 0) {
    // Show different message if we're filtering vs. no notes at all
    if (searchQuery && notes.length > 0) {
      return (
        <Card className="text-center py-12 border-dashed border-2 border-muted">
          <CardContent className="space-y-4">
            <h3 className="text-lg font-medium">No matching notes</h3>
            <p className="text-muted-foreground">
              No notes match your search for "{searchQuery}"
            </p>
            <Button 
              onClick={() => setFilteredNotes(notes)} 
              variant="outline" 
              className="mt-2"
            >
              Clear Search
            </Button>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card className="text-center py-12 border-dashed border-2 border-muted">
        <CardContent className="space-y-4">
          <h3 className="text-lg font-medium">No notes yet</h3>
          <p className="text-muted-foreground">Create your first note to get started</p>
          <Button 
            onClick={onNew} 
            className="mt-2 bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            <Plus className="mr-2 h-4 w-4" /> New Note
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {filteredNotes.map((note, index) => {
        const category = note.categories || getCategoryById(note.category_id);
        const createdDate = new Date(note.created_at);
        const updatedDate = new Date(note.updated_at);
        
        return (
          <Card 
            key={note.id} 
            className="group overflow-hidden border border-muted/40 note-card animate-fade-in"
            style={{
              animationDelay: `${index * 0.05}s`,
              borderLeftColor: category?.color || 'transparent'
            }}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl line-clamp-1">{note.title}</CardTitle>
                {category && (
                  <Badge 
                    style={{ 
                      backgroundColor: category.color,
                      color: getBrightness(category.color) > 160 ? '#000' : '#fff'
                    }}
                    className="ml-2 badge"
                  >
                    <Tag className="h-3 w-3 mr-1" /> {category.name}
                  </Badge>
                )}
              </div>
              <CardDescription className="flex items-center text-xs">
                <Clock className="h-3 w-3 mr-1 inline" /> 
                {formatDistanceToNow(updatedDate, { addSuffix: true })}
                <span className="mx-2">•</span>
                <Calendar className="h-3 w-3 mr-1 inline" />
                {format(createdDate, 'MMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground line-clamp-3">
                {note.content || 'No content'}
              </p>
            </CardContent>
            <CardFooter className="justify-end pt-0 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit(note)} 
                className="shadow-sm hover:shadow btn-hover-effect"
              >
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => handleDelete(note.id)}
                className="shadow-sm hover:shadow btn-hover-effect"
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
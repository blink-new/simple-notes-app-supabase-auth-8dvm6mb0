
import { useState, useEffect } from 'react';
import { createNote, updateNote } from '../lib/notes';
import { expandNoteWithAI } from '../lib/ai';
import { Note } from '../lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Save, X, Wand2, Loader2, ArrowLeft, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getCategories } from '../lib/categories';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from './ui/badge';

interface NoteEditorProps {
  note?: Note;
  onSave: () => void;
  onCancel: () => void;
}

export function NoteEditor({ note, onSave, onCancel }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [categoryId, setCategoryId] = useState(note?.category_id || '');
  const [categories, setCategories] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const isEditing = !!note;

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content || '');
      setCategoryId(note.category_id);
    }
    
    // Load categories
    const loadCategories = async () => {
      try {
        const categoriesData = await getCategories();
        setCategories(categoriesData);
        
        // Set default category if creating a new note and no category is selected
        if (!isEditing && !categoryId && categoriesData.length > 0) {
          setCategoryId(categoriesData[0].id);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        toast.error('Failed to load categories');
      }
    };
    
    loadCategories();
  }, [note, isEditing, categoryId]);

  // Calculate word count when content changes
  useEffect(() => {
    if (!content) {
      setWordCount(0);
      return;
    }
    
    const words = content.trim().split(/\s+/);
    setWordCount(words.length);
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (!categoryId) {
      toast.error('Please select a category');
      return;
    }
    
    setLoading(true);
    
    try {
      if (isEditing && note) {
        await updateNote(note.id, { title, content, category_id: categoryId });
        toast.success('Note updated successfully');
      } else {
        await createNote(title, content, categoryId);
        toast.success('Note created successfully');
      }
      onSave();
    } catch (error: any) {
      console.error('Error saving note:', error);
      
      // Provide more specific error messages
      if (error.message.includes('not logged in') || error.message.includes('JWT')) {
        toast.error('Authentication error. Please sign in again.');
      } else if (error.code === '23505') {
        toast.error('A note with this title already exists.');
      } else if (error.code === 'PGRST116') {
        toast.error('You do not have permission to perform this action.');
      } else {
        toast.error(error.message || 'Failed to save note');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExpandWithAI = async () => {
    // Allow expansion even if content is empty, as long as we have a title
    if (!content.trim() && !title.trim()) {
      toast.error('Please add a title or some content to expand');
      return;
    }

    setAiLoading(true);
    
    try {
      // Pass both title and content to the AI for context
      // The AI will use the title to generate content even if the content field is empty
      const expandedContent = await expandNoteWithAI(content, title);
      // Only update the content field, leave the title unchanged
      setContent(expandedContent);
      toast.success('Content expanded successfully!');
    } catch (error: any) {
      console.error('Error expanding content:', error);
      toast.error(error.message || 'Failed to expand content');
    } finally {
      setAiLoading(false);
    }
  };

  // Get selected category
  const selectedCategory = categories.find(cat => cat.id === categoryId);

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onCancel}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {isEditing ? 'Edit Note' : 'Create Note'}
        </h2>
      </div>
      
      <Card className="shadow-lg border border-muted/40">
        <form onSubmit={handleSubmit}>
          <CardHeader className="pb-2">
            <div className="space-y-4">
              <Input
                placeholder="Note title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="text-xl font-medium border-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                maxLength={100}
              />
              
              <div className="flex items-center">
                <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="w-[180px] h-8 text-sm">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedCategory && (
                  <Badge 
                    style={{ 
                      backgroundColor: selectedCategory.color,
                      color: getBrightness(selectedCategory.color) > 160 ? '#000' : '#fff'
                    }}
                    className="ml-2 badge"
                  >
                    {selectedCategory.name}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="relative">
              <Textarea
                placeholder="Write your note here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={15}
                className="resize-none focus-visible:ring-1 min-h-[300px]"
              />
              
              <div className="absolute top-2 right-2 flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-card/80 backdrop-blur-sm shadow-sm hover:bg-card transition-colors"
                  onClick={handleExpandWithAI}
                  disabled={aiLoading}
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Expanding...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-1 text-accent" />
                      Help me write
                    </>
                  )}
                </Button>
              </div>
              
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {wordCount} {wordCount === 1 ? 'word' : 'words'}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="justify-end gap-2 border-t pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="btn-hover-effect"
            >
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-md btn-hover-effect"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" /> Save Note
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
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

import { useState, useEffect } from 'react';
import { createNote, updateNote } from '../lib/notes';
import { expandNoteWithAI } from '../lib/ai';
import { Note } from '../lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Save, X, Wand2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getCategories } from '../lib/categories';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

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
    if (!content.trim()) {
      toast.error('Please add some content to expand');
      return;
    }

    setAiLoading(true);
    
    try {
      // Only pass the content to be expanded, title is just for context
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

  return (
    <Card className="shadow-lg transition-all">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Note' : 'New Note'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="text-lg font-medium"
            />
            
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
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
            
            <div className="relative">
              <Textarea
                placeholder="Write your note here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="resize-none"
              />
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
                    <Wand2 className="h-4 w-4 mr-1" />
                    Help me write
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-1" /> {loading ? 'Saving...' : 'Save'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
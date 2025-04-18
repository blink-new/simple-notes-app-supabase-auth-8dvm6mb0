
import { useState, useEffect } from 'react';
import { createNote, updateNote, getCategories } from '../lib/notes';
import { Note, Category } from '../lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface NoteEditorProps {
  note?: Note & { categories?: Category };
  onSave: () => void;
  onCancel: () => void;
}

export function NoteEditor({ note, onSave, onCancel }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [categoryId, setCategoryId] = useState(note?.category_id || '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const isEditing = !!note;

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content || '');
      setCategoryId(note.category_id);
    }
  }, [note]);

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoadingCategories(true);
        const data = await getCategories();
        setCategories(data);
        
        // If no category is selected and we have categories, select the first one
        if (!categoryId && data.length > 0) {
          setCategoryId(data[0].id);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        toast.error('Failed to load categories');
      } finally {
        setLoadingCategories(false);
      }
    }
    
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Title is required');
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
      if (error.message?.includes('not logged in') || error.message?.includes('JWT')) {
        toast.error('Authentication error. Please sign in again.');
      } else if (error.code === '23505') {
        toast.error('A note with this title already exists.');
      } else if (error.code === 'PGRST116') {
        toast.error('You do not have permission to perform this action.');
      } else if (error.code === '42501') {
        toast.error('Permission denied. Please sign in again.');
      } else {
        toast.error(error.message || 'Failed to save note');
      }
    } finally {
      setLoading(false);
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
            
            <div>
              <label className="text-sm font-medium mb-1 block text-muted-foreground">
                Category
              </label>
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
                disabled={loadingCategories}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {loadingCategories ? (
                    <SelectItem value="loading" disabled>
                      Loading categories...
                    </SelectItem>
                  ) : categories.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No categories available
                    </SelectItem>
                  ) : (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <Textarea
              placeholder="Write your note here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="resize-none"
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
          <Button type="submit" disabled={loading || loadingCategories}>
            <Save className="h-4 w-4 mr-1" /> {loading ? 'Saving...' : 'Save'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
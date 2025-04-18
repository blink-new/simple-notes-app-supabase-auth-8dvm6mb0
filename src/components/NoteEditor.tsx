
import { useState, useEffect } from 'react';
import { createNote, updateNote } from '../lib/notes';
import { Note } from '../lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface NoteEditorProps {
  note?: Note;
  onSave: () => void;
  onCancel: () => void;
}

export function NoteEditor({ note, onSave, onCancel }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [loading, setLoading] = useState(false);
  const isEditing = !!note;

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content || '');
    }
  }, [note]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    setLoading(true);
    
    try {
      if (isEditing && note) {
        await updateNote(note.id, { title, content });
        toast.success('Note updated successfully');
      } else {
        await createNote(title, content);
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
          <div className="space-y-2">
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="text-lg font-medium"
            />
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
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-1" /> {loading ? 'Saving...' : 'Save'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
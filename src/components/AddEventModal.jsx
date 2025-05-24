import { useState } from 'react';

export default function AddEventModal({ open, onClose, onEventAdded }) {
  const [form, setForm] = useState({
    summary: '',
    description: '',
    start: '',
    end: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    const accessToken = localStorage.getItem('google_access_token');
    if (!accessToken) {
      setError('Not logged in to Google');
      return;
    }
    const res = await fetch('/api/google-add-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ summary: '', description: '', start: '', end: '' });
      onClose();
      if (onEventAdded) onEventAdded();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to add event');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <form
        className="bg-white p-4 rounded shadow w-80"
        onSubmit={handleSubmit}
      >
        <h2 className="font-bold mb-2">Add Event</h2>
        <input
          className="w-full border p-2 mb-2"
          placeholder="Title"
          value={form.summary}
          onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
          required
        />
        <textarea
          className="w-full border p-2 mb-2"
          placeholder="Description"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        />
        <label className="block mb-1 text-xs">Start</label>
        <input
          className="w-full border p-2 mb-2"
          type="datetime-local"
          value={form.start}
          onChange={e => setForm(f => ({ ...f, start: e.target.value }))}
          required
        />
        <label className="block mb-1 text-xs">End</label>
        <input
          className="w-full border p-2 mb-2"
          type="datetime-local"
          value={form.end}
          onChange={e => setForm(f => ({ ...f, end: e.target.value }))}
          required
        />
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">
            Save
          </button>
          <button
            type="button"
            className="bg-gray-300 px-3 py-1 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
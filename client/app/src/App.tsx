import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import  './App.css'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const PAGE_SIZE = 20;

function App() {
  const listRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  const loadItems = async (currentPage: number, search: string) => {
    const res = await axios.get(`http://localhost:4000/api/items`, {
      params: { page: currentPage, limit: PAGE_SIZE, search },
    });
    setItems(prev => [...prev, ...res.data]);
    if (res.data.length < PAGE_SIZE) setHasMore(false);
  };

  useEffect(() => {
    axios.get('http://localhost:4000/api/selected').then(res => {
      setSelectedItems(new Set(res.data));
    });
  }, []);

  useEffect(() => {
    setItems([]);
    setPage(0);
    setHasMore(true);
  }, [searchTerm]);

  useEffect(() => {
    loadItems(page, searchTerm);
  }, [page, searchTerm]);

  const toggleSelect = (id: number) => {
    setSelectedItems(prevSelected => {
      const updatedSelected = new Set(prevSelected);
  
      if (updatedSelected.has(id)) {
        updatedSelected.delete(id);
      } else {
        updatedSelected.add(id);
      }
      console.log(Array.from(updatedSelected));
      axios.post('http://localhost:4000/api/selected', {
        selectedIds: Array.from(updatedSelected),
      }).catch(err => {
        console.error('Ошибка при отправке выбранных элементов:', err);
      });
  
      return updatedSelected;
    });
  };

  const handleScroll = () => {
    if (listRef.current) {
      const scrollPosition = listRef.current.scrollTop + listRef.current.clientHeight;
      const elementHeight = listRef.current.scrollHeight;
      if (scrollPosition >= elementHeight * 0.8 && hasMore) {
        setPage(p => p + 1);
      }
    }
  };

  useEffect(() => {
    const ref = listRef.current;
    if (ref) {
      ref.addEventListener('scroll', handleScroll);
      return () => ref.removeEventListener('scroll', handleScroll);
    }
  }, [hasMore]);

  const sensors = useSensors(useSensor(PointerSensor));

  return (
    <>
      <input
        placeholder="Поиск..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        style={{ margin: '10px', padding: '5px' }}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={({ active, over }) => {
          if (active.id !== over?.id) {
            const oldIndex = items.findIndex(i => i.id === active.id);
            const newIndex = items.findIndex(i => i.id === over?.id);
            const newItems = arrayMove(items, oldIndex, newIndex);
            setItems(newItems);
            axios.post('http://localhost:4000/api/order', newItems.map(i => i.id));
          }
        }}
      >
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="container" ref={listRef} style={{ height: '400px', overflow: 'auto' }}>
            {items.map((item) => (
              <SortableRow
                key={item.id}
                item={item}
                selected={selectedItems.has(item.id)}
                onToggle={() => toggleSelect(item.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}

export default App;

const SortableRow = ({ item, selected, onToggle }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: '8px',
    borderBottom: '1px solid #ccc',
    background: selected ? '#def' : '#000',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <input type="checkbox" checked={selected} onChange={onToggle} /> {item.name}
    </div>
  );
};

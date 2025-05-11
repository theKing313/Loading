import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [items, setItems] = useState<[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(false);
  const loadItems = async (currentPage: number, search: string) => {
    if (isLoading) return;
    isLoadingRef.current = true;
        try {
          setPage(p => p + 1);
          setIsLoading(true);
          const res = await axios.get(`https://loading-c6ds.onrender.com/api/items`, {
          withCredentials: true,
          params: { page: currentPage, limit: PAGE_SIZE, search },
        });
        // console.log(res.data)
        console.log(res)
        setItems(prev => {
          const ids = new Set(prev.map(i => i.id));
          const newUnique = res.data.filter(i => !ids.has(i.id));
          return [...prev, ...newUnique];
        });
      
        if (res.data.length < PAGE_SIZE) setHasMore(false);
    } catch (error) {
      
    }finally{
      isLoadingRef.current = false;
      setIsLoading(false);
    }

  };
  useEffect(() => {
    axios.get('https://loading-c6ds.onrender.com/api/selected').then(res => {
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
    // handleScroll();
  }, []);
  // useEffect(() => {
  //   loadItems(page, searchTerm);
  // }, [page, searchTerm]);
  const SortableRow = ({ item, selected, onToggle }: any) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      padding: '8px',
      borderBottom: '1px solid #ccc',
      background: selected ? '#def' : '#000',
      color: selected ? '#000' : '#fff',
    };

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={() => onToggle(item.id)}>
        {/* <input type="checkbox" checked={selected}     /> */}
        <input type="checkbox" checked={selected} onChange={() => onToggle(item.id)} />
      {item.name}
    </div>
    );
  };
  
  const toggleSelect = (id: number) => {
    // console.log('toggle')
    setSelectedItems(prevSelected => {
      const updatedSelected = new Set(prevSelected);
  
      if (updatedSelected.has(id)) {
        updatedSelected.delete(id);
      } else {
        updatedSelected.add(id);
      }
      // console.log(Array.from(updatedSelected));
      axios.post('https://loading-c6ds.onrender.com/api/selected', {
        selectedIds: Array.from(updatedSelected),
      }).catch(err => {
        console.error('Ошибка при отправке выбранных элементов:', err);
      });
  
      return updatedSelected;
    });
  };

const handleScroll = useCallback(() => {
  if (listRef.current) {
    console.log(listRef.current.scrollTop)
    console.log(listRef.current.clientHeight)
    const scrollPosition = listRef.current.scrollTop + listRef.current.clientHeight;
    const elementHeight = listRef.current.scrollHeight;


    console.log('Видимый ЭКРАН:' , scrollPosition)
    console.log('ЭКРАН ГЛАВНЫЙ :' , elementHeight)
    console.log('СТРАНИЦА :' , page)
    // loadItems(page, searchTerm);
    
    if (scrollPosition >= elementHeight  *0.95 && !isLoadingRef.current) {//1200
      
      loadItems(page, searchTerm);
    }
  
  }
}, [ loadItems, page, searchTerm]);

  useEffect(() => {
    const ref = listRef.current;
    if (ref) {
      ref.addEventListener('scroll', handleScroll);
      return () => ref.removeEventListener('scroll', handleScroll);
    }
  }, [hasMore   ,handleScroll, isLoading]);

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
            {items.map((item,id) => (
              <SortableRow
              key={id}
              item={item}
              selected={selectedItems.has(item.id)}
              onToggle={toggleSelect}
            />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}

export default App;


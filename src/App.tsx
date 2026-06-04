import { FormEvent, useMemo, useState } from 'react';
import { Plus, Trash2, Utensils } from 'lucide-react';

type FoodItem = {
  id: string;
  name: string;
  price: number;
  createdAt: string;
};

const storageKey = 'food-labo-items';

function loadItems(): FoodItem[] {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as FoodItem[]) : [];
  } catch {
    return [];
  }
}

function saveItems(items: FoodItem[]) {
  localStorage.setItem(storageKey, JSON.stringify(items));
}

function yen(value: number) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value);
}

export function App() {
  const [items, setItems] = useState<FoodItem[]>(loadItems);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items],
  );

  const addItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const parsedPrice = Number(price);

    if (!trimmedName || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return;
    }

    const nextItems = [
      {
        id: crypto.randomUUID(),
        name: trimmedName,
        price: Math.round(parsedPrice),
        createdAt: new Date().toISOString(),
      },
      ...items,
    ];

    setItems(nextItems);
    saveItems(nextItems);
    setName('');
    setPrice('');
  };

  const removeItem = (id: string) => {
    const nextItems = items.filter((item) => item.id !== id);
    setItems(nextItems);
    saveItems(nextItems);
  };

  return (
    <main className="app" aria-label="food-labo">
      <section className="screen">
        <header className="header">
          <div className="brand-mark" aria-hidden="true">
            <Utensils size={28} />
          </div>
          <div>
            <p className="eyebrow">食材メモ</p>
            <h1>food-labo</h1>
          </div>
        </header>

        <section className="total-panel" aria-label="合計金額">
          <span>合計</span>
          <strong>{yen(total)}</strong>
        </section>

        <form className="entry-form" onSubmit={addItem}>
          <label>
            食材
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例: たまご"
              autoComplete="off"
              inputMode="text"
            />
          </label>

          <label>
            金額
            <input
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="例: 238"
              inputMode="numeric"
              pattern="[0-9]*"
            />
          </label>

          <button className="add-button" type="submit">
            <Plus size={30} />
            記録する
          </button>
        </form>

        <section className="list-area" aria-label="記録一覧">
          <h2>今日の記録</h2>

          {items.length === 0 ? (
            <p className="empty">まだ記録がありません。</p>
          ) : (
            <ul className="food-list">
              {items.map((item) => (
                <li className="food-item" key={item.id}>
                  <div>
                    <span className="food-name">{item.name}</span>
                    <span className="food-price">{yen(item.price)}</span>
                  </div>
                  <button
                    className="delete-button"
                    type="button"
                    aria-label={`${item.name}を削除`}
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 size={26} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}

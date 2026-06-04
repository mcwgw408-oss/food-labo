import { FormEvent, useMemo, useState } from 'react';
import { Check, Pencil, Plus, Trash2, Utensils, X } from 'lucide-react';

type Category = '野菜' | '肉・魚' | '主食' | '調味料' | 'その他';

type FoodItem = {
  id: string;
  name: string;
  price: number;
  category: Category;
  createdAt: string;
};

type StoredFoodItem = Omit<FoodItem, 'category'> & {
  category?: Category;
};

const categories: Category[] = ['野菜', '肉・魚', '主食', '調味料', 'その他'];
const storageKey = 'food-labo-items';

function loadItems(): FoodItem[] {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? (JSON.parse(raw) as StoredFoodItem[]) : [];

    return parsed.map((item) => ({
      ...item,
      category: item.category ?? 'その他',
    }));
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
  const [category, setCategory] = useState<Category>('野菜');
  const [editingId, setEditingId] = useState<string | null>(null);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items],
  );

  const categoryTotals = useMemo(
    () =>
      categories
        .map((targetCategory) => ({
          category: targetCategory,
          total: items
            .filter((item) => item.category === targetCategory)
            .reduce((sum, item) => sum + item.price, 0),
        }))
        .filter((item) => item.total > 0),
    [items],
  );

  const resetForm = () => {
    setName('');
    setPrice('');
    setCategory('野菜');
    setEditingId(null);
  };

  const saveItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const parsedPrice = Number(price);

    if (!trimmedName || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return;
    }

    if (editingId) {
      const nextItems = items.map((item) =>
        item.id === editingId
          ? {
              ...item,
              name: trimmedName,
              price: Math.round(parsedPrice),
              category,
            }
          : item,
      );

      setItems(nextItems);
      saveItems(nextItems);
      resetForm();
      return;
    }

    const nextItems = [
      {
        id: crypto.randomUUID(),
        name: trimmedName,
        price: Math.round(parsedPrice),
        category,
        createdAt: new Date().toISOString(),
      },
      ...items,
    ];

    setItems(nextItems);
    saveItems(nextItems);
    resetForm();
  };

  const editItem = (item: FoodItem) => {
    setName(item.name);
    setPrice(String(item.price));
    setCategory(item.category);
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeItem = (id: string) => {
    const nextItems = items.filter((item) => item.id !== id);
    setItems(nextItems);
    saveItems(nextItems);

    if (editingId === id) {
      resetForm();
    }
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

        {categoryTotals.length > 0 && (
          <section className="category-summary" aria-label="分類別合計">
            <h2>分類別</h2>
            <div className="summary-list">
              {categoryTotals.map((item) => (
                <p key={item.category}>
                  <span>{item.category}</span>
                  <strong>{yen(item.total)}</strong>
                </p>
              ))}
            </div>
          </section>
        )}

        <form className="entry-form" onSubmit={saveItem}>
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

          <fieldset className="category-picker">
            <legend>分類</legend>
            {categories.map((categoryName) => (
              <button
                className={category === categoryName ? 'category-button active' : 'category-button'}
                type="button"
                key={categoryName}
                onClick={() => setCategory(categoryName)}
              >
                {category === categoryName && <Check size={24} />}
                {categoryName}
              </button>
            ))}
          </fieldset>

          <button className="add-button" type="submit">
            {editingId ? <Pencil size={30} /> : <Plus size={30} />}
            {editingId ? '更新する' : '記録する'}
          </button>

          {editingId && (
            <button className="cancel-button" type="button" onClick={resetForm}>
              <X size={28} />
              やめる
            </button>
          )}
        </form>

        <section className="list-area" aria-label="記録一覧">
          <h2>今日の記録</h2>

          {items.length === 0 ? (
            <p className="empty">まだ記録がありません。</p>
          ) : (
            <ul className="food-list">
              {items.map((item) => (
                <li className="food-item" key={item.id}>
                  <span className="category-label">{item.category}</span>
                  <span className="food-name">{item.name}</span>
                  <span className="food-price">{yen(item.price)}</span>

                  <div className="item-actions">
                    <button
                      className="edit-button"
                      type="button"
                      aria-label={`${item.name}を編集`}
                      onClick={() => editItem(item)}
                    >
                      <Pencil size={26} />
                      編集
                    </button>
                    <button
                      className="delete-button"
                      type="button"
                      aria-label={`${item.name}を削除`}
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 size={26} />
                      削除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}

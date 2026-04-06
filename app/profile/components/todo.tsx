"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FaPlus } from "react-icons/fa";
import Loader from "@/app/components/ui/loader";

type Todo = {
  id: number;
  title: string;
  description?: string;
  is_complete: boolean;
};

export default function TodoList() {
  const supabase = useMemo(() => createClient(), []);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodo, setNewTodo] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const fetchTodos = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setTodos([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching todos:", error);
      setTodos([]);
    } else {
      setTodos(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;

    const loadTodos = async () => {
      if (!isMounted) {
        return;
      }

      await fetchTodos();
    };

    void loadTodos();

    return () => {
      isMounted = false;
    };
  }, [fetchTodos]);

  async function toggleComplete(todo: Todo) {
    const updatedStatus = !todo.is_complete;
    const { error } = await supabase
      .from("todos")
      .update({ is_complete: updatedStatus })
      .eq("id", todo.id);

    if (error) {
      console.error("Error updating todo:", error);
      return;
    }

    setTodos((prevTodos) =>
      prevTodos.map((t) =>
        t.id === todo.id ? { ...t, is_complete: updatedStatus } : t
      )
    );
  }

  async function handleAddTodo() {
    if (!newTodo.trim()) return;
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { error } = await supabase
      .from("todos")
      .insert([{ title: newTodo.trim(), description: newDescription.trim(), is_complete: false, user_id: user.id }]);
    if (error) {
      console.error("Error adding todo:", error);
    }
    setNewTodo("");
    setNewDescription("");
    await fetchTodos();
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[16rem] items-center justify-center rounded-2xl bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4">
        <Loader
          title="Loading your tasks"
          subtitle="Getting your day organized."
        />
      </div>
    );
  }

  return (
    <main className="max-w-full bg-lime-200 shadow-xl p-4 rounded-2xl">
      <div className="border-b pt-4">
        <h1 className="text-xl">Today{"'"}s Task</h1>
      </div>

      <div className="flex items-center gap-2 justify-between my-2 rounded-xl py-6">
        <div className="flex flex-col gap-2 w-full">
          <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="What's the plan?"
          className="border-b px-2 py-1 focus:border-b outline-0"
        />
        <input
          type="text"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Tell Us About the plan"
          className="border-b px-2 py-1 focus:border-b outline-0"
        />
        </div>
        <button
          onClick={handleAddTodo}
          className="bg-black text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2"
        >
          <FaPlus className="text-white text-md" />Add
        </button>
      </div>

      {todos.length === 0 ? (
        <p className="flex justify-center items-center py-6">No todos found. Add One</p>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li key={todo.id} className="group flex items-center justify-between space-x-3 border p-2 rounded-xl border-neutral-400 bg-lime-100">
              <div className="flex flex-col flex-1 cursor-pointer">
                <span
                  title={todo.description || ''}
                  className={todo.is_complete ? "line-through text-gray-500" : ""}
                >
                  {todo.title}
                </span>
                <span className="max-h-0 overflow-hidden transition-all duration-300 ease-in-out group-hover:max-h-40 text-gray-700 text-sm mt-1">
                  {todo.description}
                </span>
              </div>
              <div
                onClick={() => toggleComplete(todo)}
                className={
                  "w-6 h-6 flex items-center justify-center rounded-full border-2 cursor-pointer transition-colors " +
                  (todo.is_complete
                    ? "bg-blue-500 border-blue-500"
                    : "bg-white border-gray-400 hover:border-blue-400")
                }
                tabIndex={0}
                role="checkbox"
                aria-checked={todo.is_complete}
              >
                {todo.is_complete && (
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12l4 4 8-8" />
                  </svg>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

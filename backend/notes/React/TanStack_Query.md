# 📚 TanStack Query Topics to Learn (Index)

# 1️⃣ Basics of TanStack Query

## **1.1 Server State vs Client State**

**Client State**

* Lives **only on the client** (your React app)
* Examples:

  * Form input values
  * Toggle switches
  * Modal open/close state
* Usually managed with `useState`, `useReducer`, or `Zustand/Redux`

**Server State**

* Lives **on the server / backend**
* Examples:

  * User profile data
  * List of todos
  * Posts or messages
* Needs to be **fetched, cached, and synchronized**

**Problem with `useEffect + useState`**

* Manual handling of: loading state, caching, refetching, error handling, deduplication
* Can get messy in bigger apps
* TanStack Query automates **all of this**

---

## **1.2 Why TanStack Query?**

**Benefits:**

* Automatic **data fetching & caching**
* Avoids duplicate network requests for the same data
* **Background updates** → stale data can be refreshed automatically
* Handles **loading / error / success states** automatically
* Supports **mutations**, **pagination**, **infinite scroll**, **SSR**, and **prefetching**

**Think of it as:** a **server-state manager** that replaces manual `useEffect` + `useState` network calls.

---

## **1.3 Installing & Setting Up**

**Step 1: Install TanStack Query**

```bash
npm install @tanstack/react-query
```

**Step 2: Setup QueryClient**

```jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

// Create a client
const queryClient = new QueryClient();

ReactDOM.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
```

* **QueryClient** → manages all queries, cache, and mutations
* **QueryClientProvider** → makes QueryClient available to all React components

---

## **1.4 Key Concepts**

| Concept        | Description                                               |
| -------------- | --------------------------------------------------------- |
| **Query**      | Fetching data (GET request)                               |
| **Mutation**   | Updating data (POST, PUT, DELETE)                         |
| **Query Key**  | Unique key for caching queries                            |
| **Cache**      | Stores query results, avoids unnecessary network requests |
| **Stale Time** | How long cached data is considered fresh                  |
| **Refetching** | Automatically fetch updated data in the background        |

---


# 2️⃣ Queries (Data Fetching)
---

## **2.1 `useQuery` Basics**

```jsx
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

function Todos() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['todos'], // unique key for caching
    queryFn: async () => {
      const res = await axios.get('/api/todos');
      return res.data;
    },
  });

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error loading todos</p>;

  return (
    <ul>
      {data.map(todo => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}
```

**Explanation:**

* `queryKey` → unique identifier for this query’s cache
* `queryFn` → function to fetch the data
* Returns:

  * `data` → fetched data
  * `isLoading` → true while fetching
  * `isError` → true if fetch fails

## **How to manage multiple queries in a single component**

There are **two ways**:

### **a) Multiple `useQuery` hooks**

```jsx
const userQuery = useQuery({ queryKey: ['user', userId], queryFn: fetchUser });
const postsQuery = useQuery({ queryKey: ['posts', userId], queryFn: fetchPostsByUser });
```

* Each query has its **own cache, loading & error state**
* Access like:

```jsx
if (userQuery.isLoading || postsQuery.isLoading) return <p>Loading...</p>;
```

---

### **b) `useQueries` (Batch multiple queries)**

```jsx
import { useQueries } from '@tanstack/react-query';

const results = useQueries({
  queries: [
    { queryKey: ['user', userId], queryFn: () => fetchUser(userId) },
    { queryKey: ['posts', userId], queryFn: () => fetchPostsByUser(userId) },
  ]
});

// Access results
const user = results[0].data;
const posts = results[1].data;
```

✅ Use `useQueries` when you want **dynamic number of queries** in a single component.

---

## **2.2 Query Keys**

* Every query needs a **unique key** → this helps TanStack Query **cache data separately**.
* Example: fetching a single todo vs all todos

```jsx
// Fetch all todos
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
});

// Fetch one todo by id
useQuery({
  queryKey: ['todo', todoId], // key includes todoId
  queryFn: () => fetchTodoById(todoId),
});
```

## **Why we add `todoId` in the query key?**

```js
useQuery({
  queryKey: ['todo', todoId],
  queryFn: () => fetchTodoById(todoId),
});
```

**Reason:**

* TanStack Query **caches queries based on `queryKey`**.
* If you have multiple todos, each todo should have **its own cache entry**.
* Example:

| queryKey      | Data cached      |
| ------------- | ---------------- |
| `['todo', 1]` | Todo with id = 1 |
| `['todo', 2]` | Todo with id = 2 |

✅ Without `todoId`, all todos would share the **same cache**, which is wrong for dynamic data.

---

## **Why sharing the same cache for multiple todos is bad**

Imagine you **don’t include `todoId`** and use:

```js
useQuery({
  queryKey: ['todo'],  // only 'todo', no id
  queryFn: () => fetchTodoById(todoId),
});
```

Now **all todos use the same cache** (`'todo'`).

### 🔹 Problems

1. **Data Overwrite**

   * Suppose you fetch `todoId = 1` → cache stores that todo.
   * Then fetch `todoId = 2` → cache **overwrites the previous todo**.
   * If you go back to `todoId = 1`, you’ll see **wrong data** (you’ll see todo 2 instead of 1).

2. **Incorrect UI Updates**

   * Components relying on cached data will render **wrong content**.
   * Example: a Todo detail page shows a **different todo** after navigating between pages.

3. **Refetch Issues**

   * Refetching will always fetch the **latest queryKey**, so the cache cannot distinguish between different todos.
   * You lose **query-level caching benefits**.

4. **Stale/Incorrect Data**

   * Imagine two users requesting different todos using the same query key.
   * They will see **each other’s cached data** → a major bug.

---

### ✅ Correct Approach

Use a **dynamic key** including the ID:

```js
useQuery({
  queryKey: ['todo', todoId],
  queryFn: () => fetchTodoById(todoId),
});
```

* Cache stores **each todo separately**:

  * `'todo', 1` → todo 1
  * `'todo', 2` → todo 2
* UI always gets the **correct todo** from cache or fetch

---

Think of `queryKey` as the **address in a filing cabinet**:

* If you put all todos under the **same drawer** (`['todo']`), they overwrite each other.
* If you give each todo a **separate folder** (`['todo', todoId]`), you can retrieve any todo correctly at any time.

---

✅ Key idea: **different key → different cache**

---

## **2.3 Handling Loading & Error**

When you fetch data, three states happen:

1. **Loading** → request is in progress
2. **Error** → request failed
3. **Success** → data is fetched successfully

```jsx
const { data, isLoading, isError, error } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
});

if (isLoading) return <p>Loading...</p>; // show spinner
if (isError) return <p>Error: {error.message}</p>; // show error
```

* `data` → contains the fetched todos when success

---

## **2.4 Caching (Simple Explanation)**

* TanStack Query **remembers the data** for a while (cache)
* Example: you visit a page → data fetched → cached
* You leave the page and come back → it **shows cached data instantly**

```jsx
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  staleTime: 5000, // 5 seconds data is “fresh”
});
```

* `staleTime` → how long the data is considered fresh (won’t refetch)

---

## **2.5 Refetching Made Simple**

Refetch = **update the data from server**

```jsx
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  refetchOnWindowFocus: true, // when user comes back to tab
  refetchInterval: 10000,     // optional: auto-refresh every 10s
});
```

* `isFetching` → true if background refetch is happening
* `isLoading` → true only on first fetch

---

### ✅ Key Takeaways (Simple)

1. `queryKey` → identifies each query for caching
2. `data` → fetched data
3. `isLoading` → true when fetching first time
4. `isError` → true if request fails
5. `staleTime` → data freshness
6. `refetchOnWindowFocus` → updates when you return to page

---


* **Query Keys** (importance of unique keys, arrays vs strings)
* Handling states: `isLoading`, `isError`, `isFetching`
* Query caching (how results are stored & reused)
* Stale time (`staleTime`) & cache time (`cacheTime`)
* Refetching:

  * on mount
  * on window focus
  * on interval (`refetchInterval`)

---

# 3️⃣ Mutations in TanStack Query

Mutations are used to **modify server data**, like creating, updating, or deleting resources. Unlike queries (GET), mutations **change the backend**.

---

## **3.1 `useMutation` Basics**

```jsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

function AddTodo() {
  const queryClient = useQueryClient();

  const addTodoMutation = useMutation({
    mutationFn: (newTodo) => axios.post('/api/todos', newTodo),
    onSuccess: () => {
      // Automatically refresh todos query
      queryClient.invalidateQueries(['todos']);
    }
  });

  const handleAdd = () => {
    addTodoMutation.mutate({ title: 'New Todo' });
  };

  return <button onClick={handleAdd}>Add Todo</button>;
}
```

**Explanation:**

* `mutationFn` → function that **performs the mutation**
* `mutate()` → triggers the mutation
* `onSuccess` → runs after mutation succeeds (often used to **refresh query data**)

---

## **3.2 Mutation Lifecycle Callbacks**

| Callback    | When it runs                  | Example Use Case                          |
| ----------- | ----------------------------- | ----------------------------------------- |
| `onSuccess` | After mutation succeeds       | Refresh cached data (`invalidateQueries`) |
| `onError`   | If mutation fails             | Show error toast / rollback UI            |
| `onSettled` | Runs after success or failure | Clean up, stop loading spinner            |

```jsx
useMutation({
  mutationFn: updateTodo,
  onSuccess: () => console.log('Todo updated!'),
  onError: (err) => console.log('Error:', err),
  onSettled: () => console.log('Mutation finished'),
});
```

---

## **3.3 Invalidating Queries**

After mutation, **server data changes**, so cached queries might be stale.

```js
queryClient.invalidateQueries(['todos']);
```

* Refreshes the `['todos']` query to **fetch latest data**
* Ensures UI always shows **up-to-date data**

---

## **3.4 Optimistic Updates**

Optimistic updates **update the UI immediately** before the server responds.

```jsx
const mutation = useMutation({
  mutationFn: addTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries(['todos']);
    const previousTodos = queryClient.getQueryData(['todos']);

    queryClient.setQueryData(['todos'], (old) => [...old, newTodo]);

    return { previousTodos };
  },
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(['todos'], context.previousTodos); // rollback
  },
  onSettled: () => queryClient.invalidateQueries(['todos']),
});
```

* `onMutate` → runs **before server request** → update cache immediately
* `onError` → rollback if request fails
* `onSettled` → refresh query anyway

---

## ✅ Quick Recap

| Concept                      | Notes                                    |
| ---------------------------- | ---------------------------------------- |
| `useMutation`                | Trigger POST/PUT/DELETE requests         |
| `mutationFn`                 | Function that does the request           |
| `mutate()` / `mutateAsync()` | Trigger the mutation                     |
| `onSuccess`                  | After success (refresh cache)            |
| `onError`                    | Handle errors, rollback UI               |
| `invalidateQueries()`        | Refresh related queries                  |
| Optimistic Updates           | Update UI immediately, rollback if fails |

---

# 4️⃣ Advanced Query Features in TanStack Query

These are features you use **after mastering basic queries and mutations**. They help in **complex scenarios** like dependent data, pagination, and server-side rendering.

---

## **4.1 Dependent Queries**

* A query that **runs only after another query is ready**
* Useful when **data depends on another query**

```jsx
const userQuery = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
});

const todosQuery = useQuery({
  queryKey: ['todos', userId],
  queryFn: () => fetchTodosByUser(userId),
  enabled: !!userQuery.data, // run only if userQuery.data exists
});
```

✅ `enabled` → prevents query from running until condition is true

---

## **4.2 Parallel Queries**

* Fetch multiple **independent queries at the same time**
* Each query runs separately and caches individually

```jsx
const [userQuery, postsQuery] = useQueries({
  queries: [
    { queryKey: ['user', userId], queryFn: () => fetchUser(userId) },
    { queryKey: ['posts', userId], queryFn: () => fetchPostsByUser(userId) },
  ],
});
```

* Useful when queries **don’t depend on each other**

---

# **Pagination & Infinite Queries in TanStack Query**

## **1️⃣ Paginated Queries (Page by Page)**

* Use **`useQuery`** if you have a **fixed page number**
* Server usually expects something like: `/posts?page=1&limit=10`

```jsx
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

function PaginatedPosts({ page }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['posts', page],
    queryFn: () => axios.get(`/api/posts?page=${page}&limit=5`).then(res => res.data),
    keepPreviousData: true, // important for smooth pagination
  });

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error fetching posts</p>;

  return (
    <div>
      {data.posts.map(post => <p key={post.id}>{post.title}</p>)}
    </div>
  );
}
```

### **Going to Previous Page**

* Keep **page number in state**

```jsx
const [page, setPage] = React.useState(1);

<button onClick={() => setPage(old => Math.max(old - 1, 1))}>Previous</button>
<button onClick={() => setPage(old => old + 1)}>Next</button>
```

* `keepPreviousData: true` → keeps current page visible while fetching new page

---

## **2️⃣ Infinite Queries (Scrolling / Load More)**

* Use **`useInfiniteQuery`** for **infinite scroll** or “load more” functionality
* Handles **pages internally**, no need to track manually

```jsx
import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';

function InfinitePosts() {
  const {
    data,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
  } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam = 1 }) => 
      axios.get(`/api/posts?page=${pageParam}&limit=5`).then(res => res.data),
    getNextPageParam: (lastPage) => lastPage.nextPage ?? false,
    getPreviousPageParam: (firstPage) => firstPage.prevPage ?? false,
  });

  return (
    <div>
      {data.pages.map(page => 
        page.posts.map(post => <p key={post.id}>{post.title}</p>)
      )}
      
      <button disabled={!hasPreviousPage || isFetchingPreviousPage} onClick={() => fetchPreviousPage()}>
        Previous
      </button>
      
      <button disabled={!hasNextPage || isFetchingNextPage} onClick={() => fetchNextPage()}>
        Next
      </button>
    </div>
  );
}
```

### **Key Points**

1. `getNextPageParam` → tells React Query **how to get the next page number**
2. `getPreviousPageParam` → tells React Query **how to get the previous page number**
3. `data.pages` → array of all fetched pages (you can flatten if needed)
4. `fetchNextPage()` → fetches next page
5. `fetchPreviousPage()` → fetches previous page

---

✅ **Summary: Pagination vs Infinite Query**

| Feature                      | `useQuery` Paginated         | `useInfiniteQuery`            |
| ---------------------------- | ---------------------------- | ----------------------------- |
| Track pages                  | Manual `page` state          | Handled internally            |
| Fetch next                   | Increment page state         | `fetchNextPage()`             |
| Fetch previous               | Decrement page state         | `fetchPreviousPage()`         |
| Keep old data while fetching | `keepPreviousData: true`     | Automatic                     |
| Best use                     | Classic pagination (buttons) | Infinite scroll / “load more” |

---

# **4.3 Prefetching in TanStack Query**

Prefetching is **fetching data before the user actually needs it**.

* Improves **UX** → when the user navigates, the data is already in cache
* Commonly used in **hovering over a link, or before page navigation**

---

## **How Prefetching Works**

1. You tell **QueryClient** to fetch a query and store it in cache
2. When the user visits the page, **React Query finds the cached data instantly**
3. No loading spinner is needed

---

## **Example: Prefetching a Todo**

```jsx
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

function TodoLink({ todoId }) {
  const queryClient = useQueryClient();

  const prefetchTodo = () => {
    queryClient.prefetchQuery({
      queryKey: ['todo', todoId],
      queryFn: () => axios.get(`/api/todos/${todoId}`).then(res => res.data),
    });
  };

  return (
    <a 
      href={`/todo/${todoId}`} 
      onMouseEnter={prefetchTodo} // prefetch on hover
    >
      View Todo {todoId}
    </a>
  );
}
```

**Explanation:**

* `queryClient.prefetchQuery` → fetches and stores data in cache
* `queryKey` → must match the query key used in your page query
* On hover (`onMouseEnter`) → starts fetching early
* When navigating to `/todo/${todoId}`, `useQuery` **finds cached data instantly**

---

## **Prefetching Before Navigation**

Another common use case: **click a “Next” page**

```jsx
const handleNext = () => {
  queryClient.prefetchQuery({
    queryKey: ['posts', page + 1],
    queryFn: () => fetchPosts(page + 1)
  });
  setPage(page + 1); // navigate to next page
};
```

* Pre-fetch ensures **next page loads instantly**

---

## ✅ Key Points

1. Prefetch **does not render data**, just stores it in cache
2. Must use the **same queryKey** as actual query on the page
3. Common triggers: `onHover`, `onClick`, or route change
4. Works perfectly with `staleTime` → if cached data is fresh, no network request is needed

---

💡 **Analogy:** Prefetching is like **bringing the next book from the shelf before the reader asks for it**. When they ask, it’s ready instantly.

---


## **4.5 Initial Data & Hydration (SSR / Next.js)**

* Provide **initial data** to avoid loading state on first render

```jsx
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  initialData: preFetchedTodosFromServer
});
```

* Useful for **server-side rendered apps**

---

## **4.6 Query Cancellation**

* Stop **in-flight requests** if not needed (e.g., user navigates away)

```jsx
useQuery({
  queryKey: ['todos'],
  queryFn: ({ signal }) => fetch('/api/todos', { signal }).then(res => res.json())
});
```

* `signal` comes from **AbortController** internally
* Prevents unnecessary network calls

---

## ✅ Quick Recap (Advanced Queries)

| Feature                      | Use Case                                 |
| ---------------------------- | ---------------------------------------- |
| Dependent Queries            | Run query only if another query is ready |
| Parallel Queries             | Fetch multiple independent queries       |
| Infinite / Paginated Queries | Fetch paginated data or infinite scroll  |
| Prefetching                  | Fetch before navigation                  |
| Initial Data / Hydration     | Avoid loading state in SSR               |
| Query Cancellation           | Stop in-flight requests                  |

---

# 5️⃣ Configuration & Global Options

Instead of setting options **for each query or mutation individually**, you can define **default behaviors globally** using `QueryClient`.

---

## **5.1 Default Query Options**

```jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,          // 1 minute before data is considered stale
      cacheTime: 1000 * 60 * 5,      // 5 minutes in cache after unused
      retry: 2,                       // retry failed queries 2 times
      refetchOnWindowFocus: true,     // default refetch on window focus
    },
    mutations: {
      retry: 1,                       // retry failed mutations once
    }
  }
});

<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

**Explanation:**

* `defaultOptions.queries` → applies to **all queries** unless overridden individually
* `defaultOptions.mutations` → applies to **all mutations**

---

## **5.2 Retry Logic**

* Automatic retries for failed requests can prevent **temporary network errors from breaking your app**

```js
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  retry: 3,              // retry 3 times
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // exponential backoff
});
```

* `retry` → number of retry attempts
* `retryDelay` → time between retries, can use **exponential backoff**

---

## **5.3 Error Boundaries Integration**

* React Query can work with **React Error Boundaries** to catch query errors

```jsx
import { ErrorBoundary } from 'react-error-boundary';
import { useQuery } from '@tanstack/react-query';

function Todos() {
  const { data } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos
  });

  return <div>{data.map(todo => <p key={todo.id}>{todo.title}</p>)}</div>;
}

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={resetErrorBoundary}>Try Again</button>
    </div>
  );
}

<ErrorBoundary FallbackComponent={ErrorFallback}>
  <Todos />
</ErrorBoundary>
```

* **ErrorBoundary** catches **errors in queries** and allows **retrying gracefully**
* Useful for **global error handling in big apps**

---

## ✅ Key Takeaways

| Feature          | Notes                                           |
| ---------------- | ----------------------------------------------- |
| Default Options  | Set `staleTime`, `cacheTime`, retry globally    |
| Retry Logic      | Automatic retries, optional exponential backoff |
| Error Boundaries | Catch query errors and show fallback UI         |

---

💡 **Tip:**

* Set **default options** once in `QueryClient` → reduces boilerplate
* Individual queries can **override global defaults** if needed

---

# **Accessing Query Data Across Components**

**Scenario:**

* You fetch data with `useQuery` in **Component A**.
* You want to access the **same data in Component B**, which is **not a child** of A.

---

## **1️⃣ Yes, you can access it without refetching**

* TanStack Query **caches queries by `queryKey`**.
* Any component can use the **same `queryKey`** in `useQuery` or `useQueryClient.getQueryData()` to get the cached data.

### **Option A – Use the same `useQuery`**

```jsx
// Component A
const { data } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
});

// Component B (not child of A)
const { data } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
});
```

✅ React Query will:

1. Check cache for `['todos']`
2. If cached & fresh → **return immediately, no network request**
3. If stale → refetch automatically

So **you don’t refetch unnecessarily**, but you still use `useQuery` in the other component to **subscribe to updates**.

---

### **Option B – Directly access cached data (without hook)**

```jsx
import { useQueryClient } from '@tanstack/react-query';

function ComponentB() {
  const queryClient = useQueryClient();
  const data = queryClient.getQueryData(['todos']); // returns cached data or undefined

  return <div>{data ? `Todos: ${data.length}` : 'No data yet'}</div>;
}
```

* `getQueryData()` → gets **cached data only**
* Won’t automatically **refetch or subscribe** to updates

---

## **2️⃣ Best Practice**

* Use **`useQuery` in every component that needs the data**

  * React Query will **reuse cache** automatically
  * Components automatically **re-render** when data changes
* Use `getQueryData()` only if:

  * You **don’t need automatic re-render**
  * You just want **one-time access**

---

### ✅ Key Takeaways

| Question                                         | Answer                                                          |
| ------------------------------------------------ | --------------------------------------------------------------- |
| Do I need to call `useQuery` in other component? | Yes, for automatic reactivity.                                  |
| Will it refetch if data is fresh?                | No, it uses cache.                                              |
| Can I access cache without refetch?              | Yes, using `queryClient.getQueryData()`, but no auto re-render. |
| Can I access data anywhere using the key?        | Yes, `queryKey` identifies cached data globally.                |

---

💡 **Analogy:**
Think of the query cache as a **library**:

* `useQuery` → you check out a book **and get notified if it’s updated**
* `getQueryData()` → you peek at the book **without subscribing to updates**

---

## 6. 🔹 DevTools

* Installing and using React Query DevTools (to see cache, queries, mutations in action).

---

## 7. 🔹 Integration & Patterns

* Using with **Axios / Fetch / GraphQL**
* Using with **Next.js / Remix** (SSR, hydration)
* Combining with **Zustand/Redux** for client state + server state separation
* Authentication flows (refetching after login/logout)

---

# 🚀 Bonus (Pro Level)

* Cache updates with `setQueryData` (manually updating cache)
* Infinite scroll with cursor/offset
* Data persistence (persisting cache across page reloads with `react-query-persist-client`)
* React Suspense integration (`suspense: true`)

---

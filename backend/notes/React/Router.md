
## 1️⃣ The Basics of Routing

React Router is a library for **single-page applications (SPA)**.
It allows:

* **Mapping a URL path to a component** (`/about` → `<About />`).
* **Navigation without full page reloads**.

In v6+, there are **two primary approaches** to define routes:

---

## 2️⃣ Approach A – JSX / Classic API

Uses:

```jsx
<QueryClientProvider client={queryClient}>
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
    </Routes>
  </BrowserRouter>
</QueryClientProvider>
```

### Key Components

| Component                   | Purpose                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **`<BrowserRouter>`**       | Wraps your app and uses the HTML5 history API (`pushState`) for clean URLs.                                                                 |
| **`<Routes>`**              | Container for all `<Route>`s. React Router v6 automatically picks the best match.                                                           |
| **`<Route>`**               | Maps a `path` to a UI (`element`).                                                                                                          |
| **`<QueryClientProvider>`** | (From React Query) – Not part of React Router, but often wrapped around the router to share a single QueryClient instance for server state. |

✅ **When to use:**

* Simple apps where data fetching is handled with `useEffect`, React Query, or SWR.
* You just need navigation (no loaders/actions).

---

### Example:

```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

This is the **classic JSX style**. It’s simple and integrates well with libraries like **React Query**.

---

## 3️⃣ Approach B – Data Router API

Uses:

```jsx
const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/about", element: <About /> }
]);

<QueryClientProvider client={queryClient}>
  <RouterProvider router={router} />
</QueryClientProvider>
```

### Key Components

| Component                   | Purpose                                                                 |
| --------------------------- | ----------------------------------------------------------------------- |
| **`createBrowserRouter()`** | Create a **router object** with an array of routes and nested children. |
| **`RouterProvider`**        | Provides the router to the app (instead of `<BrowserRouter>`).          |

✅ **When to use:**

* Apps that need **loaders** (data fetching before render), **actions** (form mutations), **errorElement** per route, or **defer()** (streaming).
* Large dashboards, e-commerce, or anything that needs **server-driven data**.

---

### Example:

```jsx
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/products",
    element: <Products />,
    // loader: async () => fetchProducts(),  // advanced usage
    // action: async () => submitForm()
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
```

---

## 4️⃣ Key Differences

| Feature                 | `<BrowserRouter>` + `<Routes>` | `createBrowserRouter` + `RouterProvider` |
| ----------------------- | ------------------------------ | ---------------------------------------- |
| Syntax                  | JSX-based                      | Config/array-based                       |
| Data Loading (`loader`) | ❌                              | ✅                                        |
| Form Actions (`action`) | ❌                              | ✅                                        |
| Error Boundaries        | Basic                          | Advanced (per-route `errorElement`)      |
| Scroll Restoration      | Manual                         | Built-in                                 |
| SSR Friendly            | Limited                        | ✅ Easier                                 |

---

## 🟢 Recommendation

* **For small/medium apps** (blog, portfolio, simple CRUD):
  ➡️ Use **BrowserRouter + Routes** for simplicity.
* **For complex apps** (HR portals, dashboards, e-commerce):
  ➡️ Use **createBrowserRouter + RouterProvider** to leverage loaders, actions, streaming.

---

## 1️⃣ What Are Nested Routes?

In React Router, **nested routes** allow:

* **Parent routes** to share **layouts/UI** (e.g., navbars, sidebars).
* **Child routes** to render inside the parent’s layout **without repeating code**.

Think of a dashboard:

```
/dashboard
/dashboard/profile
/dashboard/settings
```

All these pages share:

* **Header**
* **Sidebar**
* **Footer**
  Only the **main content** changes.

---

## 2️⃣ Key Concepts

| Concept                         | Purpose                                        |
| ------------------------------- | ---------------------------------------------- |
| **Parent Route (Layout Route)** | Holds the *shared* layout/UI.                  |
| **Child Routes**                | Actual pages rendered inside the parent.       |
| **`<Outlet>`**                  | Placeholder where the child route will render. |

---

## 3️⃣ Example with `<BrowserRouter>` + `<Routes>`

```jsx
import { BrowserRouter, Routes, Route, Outlet, Link } from "react-router-dom";

function DashboardLayout() {
  return (
    <div className="flex">
      <nav className="w-48 bg-gray-200 p-4">
        <Link to="profile">Profile</Link> |{" "}
        <Link to="settings">Settings</Link>
      </nav>

      <main className="flex-1 p-6">
        <h1 className="text-xl font-bold">Dashboard Layout</h1>
        {/* 🔹 Child route renders here */}
        <Outlet />
      </main>
    </div>
  );
}

function Profile() {
  return <div>👤 User Profile</div>;
}

function Settings() {
  return <div>⚙️ Account Settings</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout Route */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* Nested Routes */}
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          {/* Default Child Route */}
          <Route index element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

### ✅ Explanation:

* `/dashboard` → `DashboardLayout` renders, `<Outlet>` is replaced by `<Profile>` (default).
* `/dashboard/profile` → `DashboardLayout` + `<Profile>`.
* `/dashboard/settings` → `DashboardLayout` + `<Settings>`.

---

## 4️⃣ Example with **createBrowserRouter + RouterProvider**

(Data Router API)

```jsx
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Link,
} from "react-router-dom";

function DashboardLayout() {
  return (
    <div>
      <header>
        <Link to="profile">Profile</Link> | <Link to="settings">Settings</Link>
      </header>
      <Outlet />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Profile /> },   // default child
      { path: "profile", element: <Profile /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
```

This is almost identical in behavior but **configuration-driven**, making it easier to add **loaders**, **actions**, and **error boundaries**.

---

## 5️⃣ Important Notes

### 🔹 `<Outlet>` is Required

* If you forget `<Outlet>`, **child routes won’t render**.
* Think of it as a **slot** for the matching child.

### 🔹 Default Child (`index`)

* Add `index: true` (or `<Route index>`) to render a default child when the user visits the parent URL.

### 🔹 Nested URLs

* Paths in child routes are **relative** to the parent.
* Example:

  * Parent path: `/dashboard`
  * Child path: `profile`
  * Full URL: `/dashboard/profile`

---

## 6️⃣ Real-World Use Cases

* **Dashboard Layouts** (sidebar + header)
* **E-commerce** (product page → tabs: details, reviews, etc.)
* **Multi-step forms** (steps as nested routes)

---

### 🚀 Pro Tip

You can even **nest layouts inside layouts**:

```
/dashboard
  /dashboard/settings
     /dashboard/settings/security
```

Each level can have its **own layout** with its own `<Outlet>`.

---

## 1️⃣ **Loader**

* **What it is:** A function you attach to a route that **fetches data before the component renders**.
* **Why it’s useful:** Ensures your component has data ready, avoids extra `useEffect` calls, and works nicely with SSR.
* **Hook to use inside component:** `useLoaderData()` to access the data returned by the loader.

**Example:**

```jsx
async function dashboardLoader() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!user) throw redirect("/login"); // Auth guard
  const posts = fetch("/api/posts").then(res => res.json());
  return { user, posts };
}

function Dashboard() {
  const { user, posts } = useLoaderData();
  return (
    <div>
      <h2>Welcome, {user.name}</h2>
      <ul>
        {posts.map(post => <li key={post.id}>{post.title}</li>)}
      </ul>
    </div>
  );
}
```

---

## 2️⃣ **Protected Routes / Auth Guards**

* Protect routes by **checking authentication inside the loader**.
* If unauthorized, **redirect** to login page.

```jsx
import { redirect } from "react-router-dom";

async function protectedLoader() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!user) return redirect("/login");
  return { user };
}
```

* This replaces the **manual client-side checks** you would do with `useEffect` + `navigate`.

---

## 3️⃣ **Deferred Data (Streaming)**

* **`defer()`** allows you to **render part of the page immediately** while some data is still loading asynchronously.
* Often used with **large lists or slow APIs**.

```jsx
import { defer, Await } from "react-router-dom";

async function dashboardLoader() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const posts = new Promise(resolve => 
    setTimeout(() => resolve([{ id: 1, title: "Post 1" }, { id: 2, title: "Post 2" }]), 2000)
  );
  return defer({ user, posts });
}

function Dashboard() {
  const { user, posts } = useLoaderData(); 
  return (
    <div>
      <h2>Welcome, {user.name}</h2>
      <React.Suspense fallback={<p>Loading posts...</p>}>
        <Await resolve={posts}>
          {(resolvedPosts) => (
            <ul>
              {resolvedPosts.map(post => <li key={post.id}>{post.title}</li>)}
            </ul>
          )}
        </Await>
      </React.Suspense>
    </div>
  );
}
```

✅ **What happens:**

* `user` is available immediately.
* `posts` are **deferred**, displayed after 2 seconds with a fallback loading state.
* Works seamlessly with **protected routes**, because you can check auth before any rendering.

---

## 4️⃣ **Full Example (Protected + Loader + Deferred)**

```jsx
import {
  createBrowserRouter,
  RouterProvider,
  redirect,
  useLoaderData,
  defer,
  Await,
} from "react-router-dom";

function Dashboard() {
  const { user, posts } = useLoaderData();
  return (
    <div>
      <h2>Welcome, {user.name}</h2>
      <React.Suspense fallback={<p>Loading posts...</p>}>
        <Await resolve={posts}>
          {(resolvedPosts) => (
            <ul>
              {resolvedPosts.map(post => <li key={post.id}>{post.title}</li>)}
            </ul>
          )}
        </Await>
      </React.Suspense>
    </div>
  );
}

async function dashboardLoader() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!user) return redirect("/login");       // 🔹 Protected Route
  const posts = new Promise(resolve => 
    setTimeout(() => resolve([{id:1,title:"Post1"}, {id:2,title:"Post2"}]), 2000)
  );
  return defer({ user, posts });               // 🔹 Deferred Data
}

const router = createBrowserRouter([
  {
    path: "/dashboard",
    element: <Dashboard />,
    loader: dashboardLoader,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
```

---

### 🔑 Takeaways

1. **Loader**: Fetch data before rendering.
2. **useLoaderData**: Access loader’s returned data.
3. **Protected Routes**: Check auth inside loader and redirect if not authorized.
4. **Deferred Data**: Render immediately available data while streaming slower data (`defer() + Await`).

---

## 1️⃣ **What is `action()`?**

* **`action()`** is a function attached to a route that handles **mutations**, like:

  * Form submissions (`POST`, `PUT`, `DELETE`)
  * API calls triggered by user interactions
* It **runs before the component renders** and returns a value, which can be accessed via `useActionData()`.

---

### Key Points

| Feature                | Purpose                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| `action()`             | Handles mutation logic for a route (like a controller).            |
| `useActionData()`      | Hook to read the result of the action inside the component.        |
| `<Form method="post">` | Replaces `<form>` to automatically trigger the route’s `action()`. |

---

## 2️⃣ **Basic Example**

```jsx
import { createBrowserRouter, RouterProvider, Form, useActionData } from "react-router-dom";

// 🔹 Action function for login
async function loginAction({ request }) {
  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");

  // Simulated validation
  if (username === "admin" && password === "123") {
    return { success: true };
  } else {
    return { error: "Invalid credentials" };
  }
}

// 🔹 Login component
function Login() {
  const actionData = useActionData(); // 🔹 get action response
  return (
    <div>
      <h2>Login Page</h2>
      <Form method="post">
        <input name="username" placeholder="Username" />
        <input name="password" type="password" placeholder="Password" />
        <button type="submit">Login</button>
      </Form>

      {actionData?.error && <p style={{ color: "red" }}>{actionData.error}</p>}
      {actionData?.success && <p style={{ color: "green" }}>Login successful!</p>}
    </div>
  );
}

// 🔹 Router config
const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
    action: loginAction,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
```

---

## 3️⃣ **How It Works**

1. `<Form method="post">` triggers the **route’s `action()`**.
2. `action()` receives a `request` object:

   * `request.formData()` to read submitted form fields.
   * Can perform API calls or validations.
3. Return a response object (e.g., `{ error: "...", success: true }`).
4. Inside the component, use `useActionData()` to **access the returned value**.
5. The page does **not fully reload**, making it SPA-friendly.

---

## 4️⃣ **Advanced Notes**

* **Redirect after action**

```js
import { redirect } from "react-router-dom";
return redirect("/dashboard"); // after successful login
```

* **Validation & Errors**
  Return `{ error: "..." }` and show it using `useActionData()`.

* **Integration with Loaders**
  You can combine `loader()` (fetch data) and `action()` (submit data) on the same route.

---

### ✅ Benefits

1. Keeps **data-fetching & mutation logic** inside route configuration.
2. **No need for onSubmit handlers** in components.
3. Works perfectly with **nested routes** & **deferred data**.
4. Enables **optimistic UI**, SPA behavior, and SSR readiness.

---

## 1️⃣ **loader()**

| Feature                 | Description                                                                       |
| ----------------------- | --------------------------------------------------------------------------------- |
| **Purpose**             | Fetch data **before a route renders**. Prepares the component with required data. |
| **HTTP Method**         | Usually GET (read-only).                                                          |
| **Called When**         | Navigating to a route (page load or link click).                                  |
| **Access in Component** | `useLoaderData()` hook.                                                           |
| **Side Effects**        | Should **not mutate server data**. Just fetch/read.                               |
| **Example Use Case**    | Fetch user info, product details, or dashboard data.                              |

```jsx
async function dashboardLoader() {
  const user = await fetch("/api/user").then(res => res.json());
  return { user };
}

function Dashboard() {
  const { user } = useLoaderData();
  return <div>Welcome, {user.name}</div>;
}
```

✅ Key idea: **loader = GET data before render**.

---

## 2️⃣ **action()**

| Feature                 | Description                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| **Purpose**             | Handle **mutations / POST / PUT / DELETE**. Processes forms or actions initiated by the user. |
| **HTTP Method**         | POST, PUT, DELETE (mutations).                                                                |
| **Called When**         | Submitting a `<Form method="post">` or programmatic `navigate` with form submission.          |
| **Access in Component** | `useActionData()` hook.                                                                       |
| **Side Effects**        | Can **change server state** (update DB, send email, etc.).                                    |
| **Example Use Case**    | Login form, submit profile update, create a new product.                                      |

```jsx
async function loginAction({ request }) {
  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");
  
  if (username === "admin" && password === "123") return { success: true };
  return { error: "Invalid credentials" };
}

function Login() {
  const data = useActionData();
  return (
    <Form method="post">
      <input name="username" />
      <input name="password" />
      <button>Login</button>
      {data?.error && <p>{data.error}</p>}
    </Form>
  );
}
```

✅ Key idea: **action = POST/modify server state**.

---

## 3️⃣ **Quick Comparison Table**

| Aspect                  | loader()                          | action()                                          |
| ----------------------- | --------------------------------- | ------------------------------------------------- |
| **Purpose**             | Fetch data for rendering          | Handle mutations / form submissions               |
| **HTTP Method**         | GET (read-only)                   | POST / PUT / DELETE (write)                       |
| **Trigger**             | Route navigation                  | `<Form method="post">` or programmatic submission |
| **Access in Component** | `useLoaderData()`                 | `useActionData()`                                 |
| **Side Effects**        | No mutation                       | Mutates server or app state                       |
| **Typical Use**         | Dashboard data, pre-fetched lists | Login, signup, document upload, form submission   |

---

### 4️⃣ **Example Together**

```jsx
<Route
  path="/profile/:id"
  element={<Profile />}
  loader={profileLoader}     // fetch user data
  action={updateProfileAction} // handle form submission
/>
```

* Visiting `/profile/1` → **loader** fetches data.
* Submitting `<Form>` → **action** updates profile on server.
* Component uses both `useLoaderData()` and `useActionData()`.

---

💡 **Summary:**

* `loader()` = **read data** before render.
* `action()` = **write data** or handle mutations.

---

## 1️⃣ **Dynamic Segments**

* **What it is:** Part of the URL that acts as a **variable**.
* **Syntax:** Use a colon `:` in the route path.

**Example:**

```jsx
<Route path="/product/:productId" element={<Product />} />
```

* Here, `:productId` is a **dynamic segment**.
* Can be accessed inside the component using **`useParams()`**.

---

### Using `useParams()`

```jsx
import { useParams } from "react-router-dom";

function Product() {
  const { productId } = useParams(); // get dynamic segment
  return <h2>Product ID: {productId}</h2>;
}
```

**URL Examples:**

* `/product/123` → Product ID: 123
* `/product/xyz` → Product ID: xyz

✅ Key idea: **Dynamic segments allow route reuse for variable content**.

---

## 2️⃣ **Optional Segments**

* **What it is:** Segment that may or may not be present in the URL.
* **Syntax:** Add `?` at the end of the param in the route config (`v6.10+`) or create **two routes** (commonly used in v6).

**Example with two routes:**

```jsx
<Route path="/profile/:username" element={<Profile />} />
<Route path="/profile/:username/:tab" element={<Profile />} />
```

* `/profile/john` → username = john, tab = undefined
* `/profile/john/settings` → username = john, tab = settings

**Inside component:**

```jsx
const { username, tab } = useParams();
```

---

## 3️⃣ **Query Parameters (`?`)**

* URLs often have query strings: `/search?term=react&page=2`.
* Use **`useSearchParams()`** hook to read/write them.

```jsx
import { useSearchParams } from "react-router-dom";

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const term = searchParams.get("term") || "";
  const page = searchParams.get("page") || 1;

  const handleSearch = (e) => {
    e.preventDefault();
    const q = e.target.elements.query.value;
    setSearchParams({ term: q, page: 1 });
  };

  return (
    <div>
      <form onSubmit={handleSearch}>
        <input name="query" defaultValue={term} />
        <button>Search</button>
      </form>
      <p>Searching for: {term}</p>
      <p>Page: {page}</p>
    </div>
  );
}
```

✅ Key idea: **useParams() → dynamic path segments**, **useSearchParams() → query string parameters**.

---

## 4️⃣ **Combined Example: Dynamic + Optional + Query**

```jsx
<Route path="/profile/:username/:tab?" element={<Profile />} />
<Route path="/search" element={<Search />} />
```

* `/profile/john` → username = john, tab = undefined
* `/profile/john/settings` → username = john, tab = settings
* `/search?term=react&page=2` → use `useSearchParams()` to read term & page

```jsx
function Profile() {
  const { username, tab } = useParams();
  return <h2>{username}'s {tab || "overview"}</h2>;
}
```

---

### ✅ Summary

| Concept          | Hook                | Notes                                  |
| ---------------- | ------------------- | -------------------------------------- |
| Dynamic Segment  | `useParams()`       | Required path variable (`:id`)         |
| Optional Segment | `useParams()`       | Segment may or may not exist (`:tab?`) |
| Query Parameters | `useSearchParams()` | URL after `?`, can read/write          |

---

## 1️⃣ `<Link>`

* Used to navigate **between routes without reloading the page** (SPA navigation).
* Replaces `<a>` in React Router apps.

**Example:**

```jsx
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav>
      <Link to="/">Home</Link> | 
      <Link to="/about">About</Link> | 
      <Link to="/dashboard">Dashboard</Link>
    </nav>
  );
}
```

✅ Clicking a `<Link>` updates the URL and renders the corresponding component **without full reload**.

---

## 2️⃣ `<NavLink>`

* Special `<Link>` that **adds an "active" style or class** when the route matches.
* Useful for **highlighting the current page** in a menu.

**Example:**

```jsx
import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <nav>
      <NavLink 
        to="/" 
        className={({ isActive }) => isActive ? "active-link" : ""}
      >
        Home
      </NavLink>
      <NavLink 
        to="/about" 
        className={({ isActive }) => isActive ? "active-link" : ""}
      >
        About
      </NavLink>
    </nav>
  );
}
```

* `isActive` is **true** when the URL matches the `to` path.
* CSS Example:

```css
.active-link {
  font-weight: bold;
  color: blue;
}
```

---

## 3️⃣ `useNavigate()`

* Hook for **programmatic navigation**.
* Useful in event handlers, after actions, or conditional redirects.

```jsx
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const goToProfile = () => {
    navigate("/profile/john"); // navigate to new route
  };

  const goBack = () => {
    navigate(-1); // go back in history
  };

  const replaceRoute = () => {
    navigate("/login", { replace: true }); // replace current history entry
  };

  return (
    <div>
      <button onClick={goToProfile}>Go to Profile</button>
      <button onClick={goBack}>Go Back</button>
      <button onClick={replaceRoute}>Go to Login (replace)</button>
    </div>
  );
}
```

### 🔑 Notes:

| Feature                                                                    | Description                                       |
| -------------------------------------------------------------------------- | ------------------------------------------------- |
| `navigate("/path")`                                                        | Move forward to a new route                       |
| `navigate(-1)`                                                             | Go back one step in history (like browser back)   |
| `navigate("/login", { replace: true })`                                    | Replace current entry in history (no back button) |
| Can pass **state**: `navigate("/dashboard", { state: { from: "login" } })` |                                                   |

---

## 4️⃣ Example: Combined Navigation

```jsx
import { BrowserRouter, Routes, Route, Link, NavLink, useNavigate } from "react-router-dom";

function Home() {
  return <h2>Home Page</h2>;
}

function About() {
  const navigate = useNavigate();
  return (
    <div>
      <h2>About Page</h2>
      <button onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link> | 
        <NavLink to="/about" className={({isActive})=>isActive?"active":""}>About</NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

### ✅ Summary:

| API             | Usage                                                      |
| --------------- | ---------------------------------------------------------- |
| `<Link>`        | Static navigation without reload                           |
| `<NavLink>`     | Same as Link but adds **active class/style**               |
| `useNavigate()` | Programmatic navigation inside JS/handlers                 |
| `navigate(-1)`  | Go back in browser history                                 |
| `replace: true` | Replace current history entry instead of pushing a new one |

---


## 1️⃣ **`useLocation()`**

* Returns the **current location object**: information about the URL.
* Useful for:

  * Accessing query params (`?`)
  * Detecting pathname changes
  * Accessing state passed via `navigate()` or `<Link>`

### Location Object Structure

```js
{
  pathname: "/dashboard", // current path
  search: "?tab=settings", // query string
  hash: "#section1", // fragment identifier
  state: { from: "/login" }, // optional state passed via navigate
  key: "abc123" // unique key for this navigation
}
```

### Example:

```jsx
import { useLocation } from "react-router-dom";

function ShowLocation() {
  const location = useLocation();
  return (
    <div>
      <h3>Current Location Info:</h3>
      <p>Pathname: {location.pathname}</p>
      <p>Search: {location.search}</p>
      <p>Hash: {location.hash}</p>
      <p>State: {JSON.stringify(location.state)}</p>
      <p>Key: {location.key}</p>
    </div>
  );
}
```

* **Use case:** Show **breadcrumb**, highlight active route, or read `state` passed from another page.

---

## 2️⃣ **`useNavigation()`**

* Only available in **Data Router API** (`createBrowserRouter` + `RouterProvider`).
* Returns the **current navigation state** of the route:

```js
{ state: "idle" | "loading" | "submitting", location: LocationObject | null, formData: FormData | null }
```

### States:

| State        | Description                                                 |
| ------------ | ----------------------------------------------------------- |
| `idle`       | No navigation is happening                                  |
| `loading`    | Route is loading (via `<Link>` or redirect)                 |
| `submitting` | Form submission is in progress (via `<Form>` or `action()`) |

### Example: Loading Indicator

```jsx
import { useNavigation } from "react-router-dom";

function NavigationStatus() {
  const navigation = useNavigation();

  return (
    <div>
      <p>Navigation State: {navigation.state}</p>
      {navigation.state === "loading" && <p>⏳ Loading new route...</p>}
      {navigation.state === "submitting" && <p>📝 Submitting form...</p>}
    </div>
  );
}
```

* **Use case:** Show a global loading spinner for **route transitions** or **form submissions**.

---

## 3️⃣ **Combined Example**

```jsx
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { useNavigation } from "react-router-dom";

function Layout() {
  const location = useLocation();
  const navigation = useNavigation();

  return (
    <div>
      <nav>
        <Link to="/">Home</Link> | <Link to="/about">About</Link>
      </nav>

      <p>Current Path: {location.pathname}</p>
      {navigation.state === "loading" && <p>⏳ Route is loading...</p>}
      <hr />
      <Outlet />
    </div>
  );
}
```

* `useLocation()` → Reads **current URL info**.
* `useNavigation()` → Detects **transitions or form submissions**.

---

### ✅ Summary

| Hook              | Purpose                                                                         |
| ----------------- | ------------------------------------------------------------------------------- |
| `useLocation()`   | Access current URL, search, hash, state, key                                    |
| `useNavigation()` | Track route/form submission state (`idle`, `loading`, `submitting`)             |
| Typical Use       | Breadcrumbs, active links, loading indicators, conditional UI during navigation |

---


## 1️⃣ **`errorElement`**

* **Purpose:** Attach a component to a route that renders when the route **throws an error**.
* Replaces the older approach of **try/catch in components** for route-level errors.
* Can be used for:

  * 404 pages
  * Failed loader data
  * Failed action (form submission)

### Example:

```jsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./Home";
import Dashboard from "./Dashboard";
import ErrorPage from "./ErrorPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
    errorElement: <ErrorPage />, // 🔹 Rendered if loader/action fails
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
```

---

## 2️⃣ **`useRouteError()`**

* Hook to **access the error** thrown by a loader, action, or component.
* Returns an **error object** you can display to the user.

### Example Error Component:

```jsx
import { useRouteError } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError();

  console.error(error);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>😢 Oops! Something went wrong.</h1>
      <p>
        {error.status ? `Error ${error.status}: ${error.statusText}` : error.message}
      </p>
    </div>
  );
}
```

* Works with:

  * `throw new Response("Not Found", { status: 404 })` in a loader
  * `throw new Error("Failed to fetch")` in action or component

---

## 3️⃣ **Throwing Errors in Loader or Action**

```jsx
// Loader example
async function dashboardLoader() {
  const res = await fetch("/api/data");
  if (!res.ok) throw new Response("Failed to fetch dashboard", { status: res.status });
  return res.json();
}

// Action example
async function submitAction({ request }) {
  const formData = await request.formData();
  if (!formData.get("name")) throw new Error("Name is required");
  return { success: true };
}
```

* The thrown error is automatically caught by **React Router** and rendered in the `errorElement`.

---

## 4️⃣ **Nested Error Handling**

* Each route can have its **own `errorElement`**.
* Parent route errors **bubble up** if child route doesn’t have its own errorElement.
* Useful for **nested layouts**, like dashboards where errors in child pages don’t break the entire app layout.

```jsx
{
  path: "/dashboard",
  element: <DashboardLayout />,
  errorElement: <DashboardError />, // parent-level error
  children: [
    { path: "stats", element: <Stats />, errorElement: <StatsError /> }, // child-level error
  ]
}
```

---

## 5️⃣ **Quick Summary Table**

| Feature           | Purpose                                                     |
| ----------------- | ----------------------------------------------------------- |
| `errorElement`    | Route-level fallback UI for errors                          |
| `useRouteError()` | Hook to access the thrown error                             |
| Loader errors     | Use `throw new Response(...)` or `throw new Error(...)`     |
| Action errors     | Throw errors for form submission failures                   |
| Nested errors     | Child errors can have specific errorElement, else bubble up |

---

✅ **Key Takeaways:**

* **Centralized error handling** per route.
* Works with **loader, action, or component errors**.
* Combine with **layout routes** for consistent UI even when a child fails.

---

## 1️⃣ **Why Lazy Loading & Code Splitting?**

* Large apps can have many components. Loading all at once **slows the initial page load**.
* **Lazy loading** allows you to **load components only when needed**.
* **React Router v6** integrates seamlessly with `React.lazy()` and `<Suspense>`.

---

## 2️⃣ **`React.lazy()`**

* Dynamically import a component:

```jsx
import React, { lazy, Suspense } from "react";

const Dashboard = lazy(() => import("./Dashboard"));
const Profile = lazy(() => import("./Profile"));
```

* Wrap it in **`<Suspense>`** to show a fallback while loading:

```jsx
<Suspense fallback={<p>Loading...</p>}>
  <Dashboard />
</Suspense>
```

---

## 3️⃣ **Using Lazy Loading in Routes**

```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { lazy, Suspense } from "react";

const Home = lazy(() => import("./Home"));
const About = lazy(() => import("./About"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<p>Loading page...</p>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
```

✅ Only the component needed for the current route is **downloaded by the browser**, improving performance.

---

## 4️⃣ **Lazy Loading + Deferred Data (`<Await>`)**

* Often used with **`loader()` + `defer()`** for slow data.
* Combine `<Suspense>` with `<Await>` to stream content.

```jsx
import { defer, useLoaderData, Await } from "react-router-dom";
import React, { Suspense, lazy } from "react";

const PostList = lazy(() => import("./PostList"));

export async function postsLoader() {
  const postsPromise = fetch("/api/posts").then(res => res.json());
  return defer({ posts: postsPromise });
}

export default function PostsPage() {
  const { posts } = useLoaderData();

  return (
    <div>
      <h1>Posts</h1>
      <Suspense fallback={<p>Loading posts component...</p>}>
        <Await resolve={posts}>
          {(resolvedPosts) => <PostList posts={resolvedPosts} />}
        </Await>
      </Suspense>
    </div>
  );
}
```

### How It Works:

1. `PostList` component is **lazy loaded**.
2. `posts` data is **deferred** → rendered only when the promise resolves.
3. `<Suspense>` shows fallback while either the component or data is loading.

---

## 5️⃣ **Best Practices**

* Wrap **lazy components in `<Suspense>`** at the closest parent level.
* Use **`defer()` + `<Await>`** for **large API calls**, allowing partial rendering of page.
* Combine **lazy + deferred** for **max performance** in dashboards, e-commerce pages, and HR portals.

---

### ✅ Summary

| Feature                     | Purpose                                           |
| --------------------------- | ------------------------------------------------- |
| `React.lazy()`              | Dynamically import a component for code splitting |
| `<Suspense fallback={...}>` | Display a loading UI while lazy component loads   |
| `defer()`                   | Stream data from loader without blocking render   |
| `<Await resolve={...}>`     | Render deferred data once promise resolves        |

---

## 1️⃣ **What is an Error Boundary?**

* A **React component** that catches **JavaScript errors** anywhere in its child component tree.
* Prevents the **entire app from crashing**.
* In **React Router v6.4+**, the concept is integrated into the router as **route-level error boundaries** using **`errorElement`**.

---

## 2️⃣ **Route-Level Error Boundaries**

* Each route can have its own **`errorElement`**.
* Automatically catches errors from:

  * Component rendering
  * `loader()` function
  * `action()` function

### Example:

```jsx
import { createBrowserRouter, RouterProvider, useRouteError } from "react-router-dom";

function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>😢 Something went wrong</h1>
      <p>{error.status ? `Error ${error.status}: ${error.statusText}` : error.message}</p>
    </div>
  );
}

function Dashboard() {
  // Simulate error
  throw new Error("Failed to load dashboard data");
  return <div>Dashboard Content</div>;
}

const router = createBrowserRouter([
  {
    path: "/dashboard",
    element: <Dashboard />,
    errorElement: <ErrorBoundary />, // 🔹 Route-level error boundary
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
```

* Visiting `/dashboard` → error thrown → **`ErrorBoundary`** is rendered.

---

## 3️⃣ **Nested Error Boundaries**

* If a child route has its own `errorElement`, it **overrides** the parent route’s error element.
* Otherwise, the **error bubbles up** to the nearest parent with an `errorElement`.

```jsx
{
  path: "/dashboard",
  element: <DashboardLayout />,
  errorElement: <DashboardError />,
  children: [
    { path: "stats", element: <Stats />, errorElement: <StatsError /> }, // child-specific
  ]
}
```

✅ This allows **fine-grained error handling** for each section of the app.

---

## 4️⃣ **Catching Errors in Loaders/Actions**

* Throw errors intentionally to trigger **route-level error boundaries**.

```js
// Loader example
async function dashboardLoader() {
  const res = await fetch("/api/dashboard");
  if (!res.ok) throw new Response("Failed to load dashboard", { status: res.status });
  return res.json();
}

// Action example
async function formAction({ request }) {
  const formData = await request.formData();
  if (!formData.get("name")) throw new Error("Name is required");
  return { success: true };
}
```

* The **thrown error** is caught by the **nearest `errorElement`**.

---

## 5️⃣ **Key Hooks & Concepts**

| Concept                 | Purpose                                                     |
| ----------------------- | ----------------------------------------------------------- |
| `errorElement`          | Route-level fallback UI for errors                          |
| `useRouteError()`       | Hook to access the error object inside `errorElement`       |
| Nested Error Boundaries | Child route errors can have their own boundary or bubble up |
| Loader/Action errors    | Throw errors to trigger the boundary                        |

---

## 6️⃣ **Summary**

* Error boundaries in **React Router DOM v6.4+** are **route-based** rather than global React class components.
* They handle **render errors, loader errors, and action errors**.
* Nested error boundaries allow **modular error handling** per route or feature.

---

## 1️⃣ **What is Scroll Restoration?**

* In traditional apps, clicking a link often **scrolls the page to the top automatically**, but SPAs **maintain scroll position** unless handled explicitly.
* React Router DOM provides **`ScrollRestoration`** to manage scroll positions automatically during navigation.

---

## 2️⃣ **Using `<ScrollRestoration>`**

* Import from `react-router-dom`:

```jsx
import { ScrollRestoration } from "react-router-dom";
```

* Add it inside your layout or root route:

```jsx
function AppLayout() {
  return (
    <div>
      <header>My Navbar</header>
      <main>
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  );
}
```

### 🔑 Notes:

* By default:

  * Restores scroll to **top** for new routes.
  * Restores previous **scroll position** when navigating back/forward in history.
* Works with **nested routes**, **lazy-loaded components**, and **deferred data**.

---

## 3️⃣ **Custom Scroll Behavior**

You can customize scroll restoration by passing `getKey`:

```jsx
<ScrollRestoration 
  getKey={(location, matches) => location.pathname + location.search} 
/>
```

* `getKey` controls which scroll position to save/restore.
* Useful if you have **dynamic content** or **tabs in a page**.

---

## 4️⃣ **Full Layout Example**

```jsx
import { Outlet, ScrollRestoration } from "react-router-dom";

function MainLayout() {
  return (
    <div>
      <header>
        <h1>My App</h1>
      </header>

      <main>
        <Outlet /> {/* nested routes render here */}
      </main>

      <ScrollRestoration /> {/* automatically handles scroll */}
    </div>
  );
}
```

* Combine with **nested routes, loaders, and deferred data**.
* User clicks a link → scroll goes to top.
* User navigates back → previous scroll is restored.

---

## 5️⃣ **Benefits**

* Smooth SPA navigation without **manual scroll adjustments**.
* Works with **lazy-loaded components** and **route transitions**.
* Compatible with **back/forward browser buttons**.

---

✅ **Summary Table**

| Feature               | Purpose                                                                  |
| --------------------- | ------------------------------------------------------------------------ |
| `<ScrollRestoration>` | Automatically manage scroll positions between routes                     |
| Default               | Scrolls to top on new routes; restores previous position on back/forward |
| `getKey`              | Customize how scroll positions are stored/restored                       |
| Works with            | Nested routes, loaders, lazy-loaded components, deferred data            |

---

## Demo 

### 📂 `App.jsx`

```jsx
import React, { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Link,
  useNavigate,
  useLocation,
  useNavigation,
  useLoaderData,
  useActionData,
  Form,
  redirect,
  defer,
  Await,
  ScrollRestoration,
} from "react-router-dom";

// ---------- LAYOUT COMPONENTS ----------
function RootLayout() {
  const navigation = useNavigation();           // 🔹 detect pending navigation {Idle, Loading, Submitting}
  const location = useLocation();               // 🔹 access path/search/hash {hash, key, pathname, search, state}
  return (
    <div>
      <header style={{ padding: 10, background: "#eee" }}>
        <Link to="/">Home</Link> |{" "}
        <Link to="/dashboard">Dashboard</Link> |{" "}
        <Link to="/profile/john?tab=info">Profile</Link> |{" "}
        <Link to="/login">Login</Link>
      </header>

      {/* 🔹 Show global loading during route transitions */}
      {navigation.state === "loading" && <p>⏳ Loading...</p>}

      <main>
        <Outlet />  {/* 🔹 nested route content renders here */}
      </main>

      <ScrollRestoration /> {/* 🔹 remembers scroll on navigation */}
      <footer style={{ padding: 10 }}>Path: {location.pathname}</footer>
    </div>
  );
}

// ---------- BASIC PAGES ----------
function Home() {
  return <h2>🏠 Home Page</h2>;
}

function Login() {
  const actionData = useActionData(); // 🔹 show action() result
  return (
    <div>
      <h2>🔑 Login Page</h2>
      <Form method="post">
        <input name="username" placeholder="Enter username" />
        <button type="submit">Login</button>
      </Form>
      {actionData?.error && <p style={{ color: "red" }}>{actionData.error}</p>}
    </div>
  );
}

// ---------- PROTECTED DASHBOARD ----------
function Dashboard() {
  const { user, posts } = useLoaderData(); // 🔹 loader data (with defer)
  return (
    <div>
      <h2>📊 Dashboard (Protected)</h2>
      <p>Welcome, {user.name}!</p>
      {/* 🔹 Await deferred posts */}
      <React.Suspense fallback={<p>Loading posts...</p>}>
        <Await resolve={posts}>
          {(resolved) => (
            <ul>
              {resolved.map((p) => (
                <li key={p.id}>{p.title}</li>
              ))}
            </ul>
          )}
        </Await>
      </React.Suspense>
    </div>
  );
}

// ---------- DYNAMIC PROFILE ----------
function Profile() {
  const navigate = useNavigate(); // 🔹 programmatic navigation
  const { username } = useLoaderData(); // from loader
  return (
    <div>
      <h2>👤 Profile of {username}</h2>
      <button onClick={() => navigate(-1)}>⬅️ Go Back</button>
    </div>
  );
}

// ---------- ERROR ELEMENT ----------
function ErrorPage() {
  return <h2 style={{ color: "red" }}>⚠️ Something went wrong!</h2>;
}

// ---------- LOADERS & ACTIONS ----------
async function loginAction({ request }) {
  const formData = await request.formData();
  const username = formData.get("username");
  if (username === "admin") {
    localStorage.setItem("user", JSON.stringify({ name: username }));
    return redirect("/dashboard");
  }
  return { error: "Invalid username (try 'admin')" };
}

async function protectedLoader() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!user) throw redirect("/login"); // 🔹 auth guard
  // Simulate fast + slow data
  return defer({
    user,
    posts: new Promise((resolve) =>
      setTimeout(
        () => resolve([{ id: 1, title: "First Post" }, { id: 2, title: "Second Post" }]),
        2000
      )
    ),
  });
}

async function profileLoader({ params }) {
  return { username: params.username }; // 🔹 dynamic segment
}

// ---------- LAZY LOADING ----------
const LazyAbout = lazy(() => import("./LazyAbout")); // separate file

// ---------- ROUTER CONFIG ----------
const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> }, // "/" route
      {
        path: "about",
        element: (
          <Suspense fallback={<p>Loading About...</p>}>
            <LazyAbout />
          </Suspense>
        ),
      },
      {
        path: "login",
        element: <Login />,
        action: loginAction, // 🔹 handle login form
      },
      {
        path: "dashboard",
        element: <Dashboard />,
        loader: protectedLoader, // 🔹 protected route + defer
      },
      {
        path: "profile/:username", // 🔹 dynamic segment
        loader: profileLoader,
        element: <Profile />,
      },
      {
        path: "profile/:username/:tab?", // 🔹 optional segment
        loader: profileLoader,
        element: <Profile />,
      },
      { path: "*", element: <ErrorPage /> }, // catch-all
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
```

---

### 📂 `LazyAbout.jsx` (Lazy Loaded Page)

```jsx
export default function LazyAbout() {
  return <h2>ℹ️ About Page (Lazy Loaded)</h2>;
}
```

---

## 🔑 Concepts Demonstrated

| Feature                            | Where to See                                       |
| ---------------------------------- | -------------------------------------------------- |
| **Routing**                        | `createBrowserRouter` config                       |
| **Nested Routes + Layout**         | `RootLayout` with `<Outlet />`                     |
| **Dynamic & Optional Segments**    | `/profile/:username/:tab?`                         |
| **Navigation APIs**                | `useNavigate()` in `Profile`                       |
| **Location & Transition Hooks**    | `useLocation()`, `useNavigation()` in `RootLayout` |
| **Error Handling**                 | `errorElement` & `<ErrorPage />`                   |
| **Protected Routes / Auth Guards** | `protectedLoader` with `redirect()`                |
| **Lazy Loading & Code Splitting**  | `lazy()` + `<Suspense>` (`LazyAbout`)              |
| **Scroll Restoration**             | `<ScrollRestoration />`                            |
| **loader()**                       | `protectedLoader`, `profileLoader`                 |
| **Deferred Data (Streaming)**      | `defer({ posts: promise })` in `protectedLoader`   |
| **action()**                       | `loginAction` for login form                       |
| **useLoaderData()**                | `Dashboard`, `Profile`                             |
| **useActionData()**                | `Login`                                            |
| **<Suspense>**                     | Used for lazy and `Await`                          |

---

### ▶️ How It Works

1. **Protected Route** – Visit `/dashboard` without logging in → redirects to `/login`.
2. **Login Form** – Enter `admin` → redirected back to dashboard.
3. **Deferred Data** – Dashboard shows user instantly, posts stream in 2 seconds later.
4. **Dynamic Profile** – `/profile/john` shows dynamic `john`.
5. **Optional Segment** – `/profile/john/info` still works.
6. **Lazy Loading** – `/about` component is loaded on demand.

This single demo combines **all the advanced React Router DOM concepts** in a real-world style setup.

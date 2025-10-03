# 🔹 Redux Thunk Advanced Guide

## 1. What is Redux Thunk? (quick refresher)

Normally, Redux actions are plain objects:

```js
{ type: "USER_LOGIN", payload: { id: 1, name: "Ganesh" } }
```

With **redux-thunk**, you can dispatch **functions**:

```js
dispatch((dispatch, getState) => {
  // async or conditional logic
  dispatch({ type: "LOGIN_START" });
});
```

👉 That function (thunk) can:

* Do async calls (fetch, axios).
* Dispatch multiple actions.
* Access current state (`getState`).

---

## 2. Async Flow Pattern

The standard pattern is **Start → Success → Failure**.

```js
// actions.js
export const fetchUsers = () => async (dispatch, getState) => {
  dispatch({ type: "users/fetchStart" });
  try {
    const res = await fetch("/api/users");
    const data = await res.json();
    dispatch({ type: "users/fetchSuccess", payload: data });
  } catch (err) {
    dispatch({ type: "users/fetchFailure", payload: err.message });
  }
};
```

---

## 3. Conditional Thunks (Avoid Duplicate Requests)

Sometimes you want to fetch only if not already in state.

```js
export const fetchUsersIfNeeded = () => async (dispatch, getState) => {
  const { users } = getState();
  if (users.loaded || users.loading) return; // prevent duplicate calls
  dispatch(fetchUsers());
};
```

---

## 4. Thunks for **Dependent Actions**

You can dispatch actions in sequence:

```js
export const fetchUserAndPosts = userId => async (dispatch) => {
  await dispatch(fetchUser(userId));   // wait for user
  await dispatch(fetchPosts(userId));  // then fetch posts
};
```

---

## 5. Optimistic Updates with Rollback

Thunks let you **update UI immediately** and rollback if API fails.

```js
export const deleteTodo = (id) => async (dispatch, getState) => {
  // optimistic update
  dispatch({ type: "todos/deleteOptimistic", payload: id });
  
  try {
    await fetch(`/api/todos/${id}`, { method: "DELETE" });
  } catch (err) {
    // rollback if failed
    dispatch({ type: "todos/deleteRollback", payload: id });
  }
};
```

---

## 6. Handling Parallel & Batch Requests

You can use `Promise.all` inside a thunk:

```js
export const fetchDashboard = () => async dispatch => {
  dispatch({ type: "dashboard/loading" });
  try {
    const [users, posts] = await Promise.all([
      fetch("/api/users").then(r => r.json()),
      fetch("/api/posts").then(r => r.json())
    ]);
    dispatch({ type: "dashboard/success", payload: { users, posts } });
  } catch (err) {
    dispatch({ type: "dashboard/error", payload: err.message });
  }
};
```

---

## 7. Error Handling & Global Notifications

A thunk can dispatch to a **global slice** (like notifications).

```js
export const savePost = (post) => async (dispatch) => {
  try {
    const res = await fetch("/api/posts", {
      method: "POST",
      body: JSON.stringify(post)
    });
    const data = await res.json();
    dispatch({ type: "posts/addSuccess", payload: data });
  } catch (err) {
    dispatch({ type: "notifications/add", payload: { type: "error", message: err.message } });
  }
};
```

---

## 8. Testing Thunks

You can test thunks by mocking dispatch.

```js
it("fetchUsers dispatches success", async () => {
  const mockDispatch = jest.fn();
  global.fetch = jest.fn(() =>
    Promise.resolve({ json: () => Promise.resolve([{ id: 1, name: "Ganesh" }]) })
  );

  await fetchUsers()(mockDispatch, () => ({}));

  expect(mockDispatch).toHaveBeenCalledWith({ type: "users/fetchStart" });
  expect(mockDispatch).toHaveBeenCalledWith({
    type: "users/fetchSuccess",
    payload: [{ id: 1, name: "Ganesh" }]
  });
});
```

---

## 9. Best Practices

* ✅ Keep thunks **thin**: API calls + dispatch, business logic goes in reducers/selectors.
* ✅ Use **createAsyncThunk** (from Redux Toolkit) if possible → less boilerplate.
* ✅ Avoid chaining too many dispatches → group related actions into one reducer.
* ✅ For complex async flows (saga-level stuff), consider redux-saga.

---

🔥 So with **Redux Thunk** you can handle:

* Async data fetching
* Optimistic UI updates
* Conditional requests
* Dependent flows
* Error handling with global notifications
* Parallel/batch requests

---

`createAsyncThunk` comes from **Redux Toolkit (RTK)**, and it helps you handle async logic (like fetching data) with **much less boilerplate**.

---

# 🔹 What is `createAsyncThunk`?

It’s a function that:

1. Takes an **action type** (like `"users/fetch"`).
2. Takes an **async function** (your API call).
3. Automatically generates **pending / fulfilled / rejected actions** for you.

---

## Example: Fetch Users with `createAsyncThunk`

### ✅ Without `createAsyncThunk` (manual thunk)

```js
export const fetchUsers = () => async (dispatch) => {
  dispatch({ type: "users/fetchStart" });
  try {
    const res = await fetch("/api/users");
    const data = await res.json();
    dispatch({ type: "users/fetchSuccess", payload: data });
  } catch (err) {
    dispatch({ type: "users/fetchFailure", payload: err.message });
  }
};
```

👉 Lots of boilerplate.

---

### ✅ With `createAsyncThunk`

```js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

// 1. Define async thunk
export const fetchUsers = createAsyncThunk(
  "users/fetch", // action type
  async () => {
    const res = await fetch("/api/users");
    return res.json();  // <-- this becomes action.payload
  }
);

// 2. Create slice
const usersSlice = createSlice({
  name: "users",
  initialState: { data: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  }
});

export default usersSlice.reducer;
```

---

## How it Works

When you `dispatch(fetchUsers())`, RTK does this behind the scenes:

* Dispatches **`users/fetch/pending`**
* Runs your async function
* If success → dispatches **`users/fetch/fulfilled`**
* If error → dispatches **`users/fetch/rejected`**

---

## Benefits

* ✅ No need to write three separate actions manually (loading, success, error).
* ✅ Works seamlessly with **Immer** (so reducers look clean).
* ✅ Handles errors automatically (gives you `action.error`).
* ✅ Easy to test.
* ✅ Plays well with TypeScript (full type safety).

---

⚡ In short:
`createAsyncThunk` = **“Thunk generator that handles loading/success/error for you.”**

---

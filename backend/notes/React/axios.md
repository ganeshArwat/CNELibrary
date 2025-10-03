Sure! Here’s a **clear, beginner-friendly guide to Axios** with examples so you can start using it effectively. 🚀

---

## 🌟 What is Axios?

**Axios** is a JavaScript library for making **HTTP requests** (like `GET`, `POST`, `PUT`, `DELETE`) to APIs or servers.
It works in **browser** (React, Vue, Angular, etc.) and **Node.js**.

---

## 📦 Installation

If you’re using **React/Node**:

```bash
npm install axios
# or
yarn add axios
```

If using a simple `<script>` in HTML:

```html
<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
```

---

## ⚡ Basic Usage

### 1️⃣ GET Request (Fetch Data)

```javascript
import axios from "axios";

axios
  .get("https://jsonplaceholder.typicode.com/posts/1")
  .then((response) => {
    console.log(response.data); // ✅ Data from API
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
  });
```

---

### 2️⃣ POST Request (Send Data)

```javascript
import axios from "axios";

axios
  .post("https://jsonplaceholder.typicode.com/posts", {
    title: "Hello Axios",
    body: "This is my first post!",
    userId: 1,
  })
  .then((response) => {
    console.log("Post created:", response.data);
  })
  .catch((error) => {
    console.error("Error creating post:", error);
  });
```

---

### 3️⃣ Using **async/await** (Cleaner Way)

```javascript
import axios from "axios";

async function fetchPost() {
  try {
    const res = await axios.get("https://jsonplaceholder.typicode.com/posts/1");
    console.log(res.data);
  } catch (err) {
    console.error("Error:", err);
  }
}

fetchPost();
```

---

## 🎯 Common HTTP Methods

| Method     | Purpose               | Example                  |
| ---------- | --------------------- | ------------------------ |
| **GET**    | Read data             | `axios.get(url)`         |
| **POST**   | Create new data       | `axios.post(url, data)`  |
| **PUT**    | Update entire record  | `axios.put(url, data)`   |
| **PATCH**  | Update partial record | `axios.patch(url, data)` |
| **DELETE** | Remove data           | `axios.delete(url)`      |

---

## 🔧 Setting Headers (Example: Sending Token)

```javascript
axios.get("/api/user", {
  headers: {
    Authorization: "Bearer YOUR_TOKEN_HERE",
  },
});
```

---

## ⚡ Create a Reusable Instance

When working in **React**, it’s common to create an instance with a base URL.

`api.js`

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: "https://jsonplaceholder.typicode.com",
  timeout: 5000, // 5 seconds timeout
});

export default api;
```

Usage:

```javascript
import api from "./api";

async function getUsers() {
  const res = await api.get("/users");
  console.log(res.data);
}
```

---

## 🔥 Interceptors (Global Loading/Errors)

You can add **interceptors** to handle things like:

- Automatically attaching tokens
- Showing a loading spinner
- Handling errors globally

```javascript
api.interceptors.request.use((config) => {
  console.log("Request sent:", config.url);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);
```

---

## ⚛️ Axios in React Example

```jsx
import { useEffect, useState } from "react";
import axios from "axios";

export default function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios
      .get("https://jsonplaceholder.typicode.com/users")
      .then((res) => setUsers(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map((u) => (
          <li key={u.id}>{u.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## ✅ Key Tips

🔑 **Always handle errors** (`try/catch` or `.catch`)
🔑 **Use async/await** for cleaner code
🔑 **Use instances** to avoid repeating base URLs
🔑 **Add interceptors** for tokens & global error handling

---

## 🔎 Axios Response Object

When you call Axios and the request is **successful** (status code `2xx`),
Axios returns a **response object** like this:

```json
{
  "data": {...},         // ✅ Actual data from server
  "status": 200,         // ✅ HTTP status code
  "statusText": "OK",    // e.g. "Created", "Not Found"
  "headers": {...},      // HTTP headers
  "config": {...},       // Axios request config
  "request": {...}       // The actual request object
}
```

### Example:

```javascript
const res = await axios.get("/api/user");
console.log(res.status); // e.g. 200
console.log(res.data);   // Actual API data
```

---

## ✅ Checking Status Codes

Even though Axios **automatically throws an error for non-2xx codes**,
you might still want to **manually check** status.

### Example:

```javascript
try {
  const res = await axios.get("/api/user");

  if (res.status === 200) {
    console.log("✅ Success:", res.data);
  } else if (res.status === 201) {
    console.log("✅ Created:", res.data);
  }
} catch (err) {
  console.error("Request failed:", err);
}
```

> ⚠️ **Note:** Axios considers **only 2xx responses as success** by default.
> If the status is 4xx/5xx → it goes to the `catch` block.

---

## ❌ Handling Errors (4xx, 5xx)

When the request fails, Axios throws an **Error object**.

### Error Structure

```javascript
try {
  await axios.get("/api/does-not-exist");
} catch (error) {
  console.log(error.response); // ✅ Only if the server responded
  console.log(error.request);  // ✅ If request was sent but no response
  console.log(error.message);  // ✅ Human-readable message
}
```

Inside `error.response`, you’ll get:

```json
{
  "data": {...},       // Error details from server (if any)
  "status": 404,
  "statusText": "Not Found",
  ...
}
```

---

### Handling Different Status Codes

You can check the code inside the catch block:

```javascript
try {
  await axios.get("/api/some-data");
} catch (error) {
  if (error.response) {
    // Server responded but with a 4xx or 5xx status
    const { status, data } = error.response;

    if (status === 400) {
      console.error("Bad Request:", data.message);
    } else if (status === 401) {
      console.error("Unauthorized! Redirecting to login...");
    } else if (status >= 500) {
      console.error("Server error. Please try again later.");
    }
  } else if (error.request) {
    // Request was sent but no response
    console.error("No response received:", error.request);
  } else {
    // Something else caused the error
    console.error("Error setting up request:", error.message);
  }
}
```

---

## 🔁 Retrying Failed Requests

Sometimes you might want to **retry** on server errors:

```javascript
async function fetchDataWithRetry() {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await axios.get("/api/data");
      return res.data;
    } catch (err) {
      if (attempt === 2 || (err.response && err.response.status < 500)) {
        throw err; // Stop retrying for client errors or last attempt
      }
      console.warn("Retrying...", attempt + 1);
    }
  }
}
```

---

## ⚡ Global Error Handling with Interceptors

Instead of writing error handling in every request,
you can create a **global error handler**:

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// Interceptor for responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        console.error("Unauthorized → Redirect to login");
        // e.g. window.location = "/login";
      } else if (status >= 500) {
        console.error("Server error → Show toast");
      }
    } else if (error.request) {
      console.error("Network issue → Maybe show 'offline' UI");
    }
    return Promise.reject(error); // Important!
  }
);
```

Now every request using `api.get`, `api.post` will use this handler.

---

## 🧩 Full Example in React

```jsx
import { useEffect, useState } from "react";
import axios from "axios";

export default function App() {
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get("/api/user");
        setData(res.data);
      } catch (err) {
        if (err.response) {
          if (err.response.status === 404) setErrorMsg("User not found!");
          else if (err.response.status >= 500) setErrorMsg("Server is down!");
          else setErrorMsg("Something went wrong.");
        } else {
          setErrorMsg("Network error, check your internet.");
        }
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <h1>User Data</h1>
      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
```

---

## ✅ Key Takeaways

💡 **res.status** → use when you need to check success codes (200, 201, etc.).
💡 **error.response** → use to get server error details.
💡 Always use **try/catch** with `async/await`.
💡 Use **interceptors** for global error handling (auth, toast notifications).

---

## 🌐 HTTP Status Code Categories

| Category | Range   | Meaning                                                |
| -------- | ------- | ------------------------------------------------------ |
| **1xx**  | 100–199 | **Informational** – Request received, still processing |
| **2xx**  | 200–299 | **Success** – Request succeeded                        |
| **3xx**  | 300–399 | **Redirection** – More action needed                   |
| **4xx**  | 400–499 | **Client Error** – Problem with request                |
| **5xx**  | 500–599 | **Server Error** – Problem on the server               |

---

## ✅ 1xx – Informational (Rare in Axios)

These mean “still working, not done yet.”
Axios usually doesn’t expose them because the final response follows.

| Code                        | Name                                         | Meaning |
| --------------------------- | -------------------------------------------- | ------- |
| **100** Continue            | Client should keep sending request body      |         |
| **101** Switching Protocols | Server is changing protocol (e.g. WebSocket) |         |
| **102** Processing (WebDAV) | Request accepted but still processing        |         |

> ⚡️You rarely handle these in Axios; the library waits for the final 2xx/3xx.

---

## ✅ 2xx – Success

These are the most common **successful** statuses.

| Code                      | Name                                         | Typical Usage |
| ------------------------- | -------------------------------------------- | ------------- |
| **200** OK                | Standard success with response data          |               |
| **201** Created           | Resource created (e.g. after POST)           |               |
| **202** Accepted          | Request accepted but not processed yet       |               |
| **203** Non-Authoritative | Data returned but may be from a cache/proxy  |               |
| **204** No Content        | Success, **no body** (e.g. DELETE)           |               |
| **205** Reset Content     | Tell client to reset the form                |               |
| **206** Partial Content   | Used for range requests (e.g. file download) |               |

👉 **Axios behavior**:
✅ `then` block is called for all **2xx** codes.
`res.data` contains the body except for 204 (empty).

---

## ✅ 3xx – Redirection

Server is telling the client to go somewhere else.

| Code                       | Name                          | Meaning |
| -------------------------- | ----------------------------- | ------- |
| **300** Multiple Choices   | Multiple options for resource |         |
| **301** Moved Permanently  | Resource moved, use new URL   |         |
| **302** Found (Redirect)   | Temporary redirect            |         |
| **303** See Other          | Redirect using GET            |         |
| **304** Not Modified       | Use cached version            |         |
| **307** Temporary Redirect | Like 302 but keeps method     |         |
| **308** Permanent Redirect | Like 301 but keeps method     |         |

👉 **Axios behavior**:

* **Browser**: Automatically follows redirects (so you usually still get a final 2xx).
* **Node.js**: Also follows by default.

---

## ❌ 4xx – Client Errors

Something is wrong with **your request**.

| Code                                   | Name                                    | Meaning |
| -------------------------------------- | --------------------------------------- | ------- |
| **400** Bad Request                    | Invalid request syntax or data          |         |
| **401** Unauthorized                   | Missing/invalid auth (e.g. token)       |         |
| **403** Forbidden                      | Authenticated but not allowed           |         |
| **404** Not Found                      | Resource doesn’t exist                  |         |
| **405** Method Not Allowed             | Wrong HTTP method                       |         |
| **406** Not Acceptable                 | Server can’t return requested format    |         |
| **408** Request Timeout                | Client took too long                    |         |
| **409** Conflict                       | Resource conflict (e.g. duplicate)      |         |
| **410** Gone                           | Resource permanently gone               |         |
| **411** Length Required                | Missing Content-Length header           |         |
| **413** Payload Too Large              | Body too big                            |         |
| **415** Unsupported Media Type         | Wrong Content-Type                      |         |
| **418** I’m a Teapot ☕ (fun spec)      | Joke, but some APIs use it              |         |
| **422** Unprocessable Entity           | Validation failed (common in REST APIs) |         |
| **429** Too Many Requests (Rate Limit) | Too many requests in a short time       |         |

👉 **Axios behavior**:

* **catch block** is triggered.
* `error.response.status` contains the code.
* `error.response.data` often has an error message.

---

## ❌ 5xx – Server Errors

Problem is on the **server side**, not your request.

| Code                                    | Name                                  | Meaning |
| --------------------------------------- | ------------------------------------- | ------- |
| **500** Internal Server Error           | Generic server crash                  |         |
| **501** Not Implemented                 | Method not supported                  |         |
| **502** Bad Gateway                     | Invalid response from upstream server |         |
| **503** Service Unavailable             | Server overloaded or down             |         |
| **504** Gateway Timeout                 | Upstream server didn’t respond        |         |
| **505** HTTP Version Not Supported      |                                       |         |
| **507** Insufficient Storage            | Server can’t store representation     |         |
| **511** Network Authentication Required |                                       |         |

👉 **Axios behavior**:

* **catch block** is triggered.
* Usually you **retry** or show a “server down” message.

---

## 🌟 Practical Handling Patterns

### ✅ Basic Pattern

```javascript
try {
  const res = await axios.get("/api/data");
  console.log(res.status, res.data);
} catch (err) {
  if (err.response) {
    const { status, data } = err.response;

    if (status === 400) alert("Bad request!");
    else if (status === 401) alert("Please log in again");
    else if (status === 404) alert("Not found");
    else if (status >= 500) alert("Server is down, try later");
    else alert(`Error ${status}: ${data.message || "Unknown error"}`);
  } else if (err.request) {
    alert("No response – check your network");
  } else {
    alert("Request failed to start: " + err.message);
  }
}
```

### ✅ Handling 204 (No Content)

```javascript
const res = await axios.delete("/api/item/1");
if (res.status === 204) {
  console.log("Deleted successfully (no data to return).");
}
```

### ✅ Handling Rate Limiting (429)

```javascript
try {
  await axios.get("/api/limit");
} catch (err) {
  if (err.response?.status === 429) {
    console.log("Slow down! Try again after", err.response.headers["retry-after"]);
  }
}
```

---

## 🚀 Key Takeaways

💡 `res.status` → only for **success responses (2xx)**.
💡 `error.response.status` → for **4xx/5xx**.
💡 Use **specific codes** (401, 404, 500) for precise messages.
💡 Use **interceptors** to handle common codes globally (like 401 → logout).

---


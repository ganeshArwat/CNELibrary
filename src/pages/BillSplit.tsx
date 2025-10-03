import React, { useState, useEffect } from "react";
import Select, { components } from "react-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import ShowPdf from "@/components/ShowPdf";
import { generateBillPdf } from "@/features/pdf/billPdf/billPdf";
// Types
interface User {
  id: number;
  name?: string;
  username?: string;
  email?: string;
}

interface Item {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  consumers: number[];
  splitAmount: number;
}

interface UserDetail {
  total: number;
  items: { name: string; share: number }[];
}

// Sample Users
const userList: User[] = [
  {
    id: 1,
    name: "Ganesh Arwat",
    username: "Ganesh",
    email: "ganesh@example.com",
  },
  {
    id: 2,
    name: "Swapnil Mane",
    username: "Swapnil",
    email: "swapnil@example.com",
  },
  {
    id: 3,
    name: "Pranay Giradkar",
    username: "Pranay",
    email: "pranay@example.com",
  },
  { id: 4, name: "Rohit Pawar", username: "Rohit", email: "rohit@example.com" },
  {
    id: 5,
    name: "AbdulRaheman Sayyed",
    username: "Raheman",
    email: "raheman@example.com",
  },
];

const BillSplit: React.FC = () => {
  const [preview, setPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState({
    bill: "",
  });
  const [items, setItems] = useState<Item[]>([]);
  const [users] = useState<User[]>(userList);
  const [grandTotal, setGrandTotal] = useState(0);
  const [userDetails, setUserDetails] = useState<Record<number, UserDetail>>(
    {}
  );
  const today = new Date();
  const formattedToday = today.toISOString().split("T")[0];

  const [billDate, setBillDate] = useState<string>(formattedToday);
  const [venue, setVenue] = useState<string>("Lunch");

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: "",
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        consumers: [],
        splitAmount: 0,
      },
    ]);
  };

  const updateItem = (
    id: number,
    field: keyof Omit<Item, "id">,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value } as Item;
        const qty = parseFloat(String(updated.quantity)) || 0;
        const price = parseFloat(String(updated.unitPrice)) || 0;
        updated.totalPrice = qty * price;
        const splitCount = updated.consumers.length || 1;
        updated.splitAmount = updated.totalPrice / splitCount;
        return updated;
      })
    );
  };

  const handleConsumersChange = (itemId: number, selected: any) => {
    const selectedIds = selected ? selected.map((s: any) => s.value) : [];
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              consumers: selectedIds,
              splitAmount: item.totalPrice / (selectedIds.length || 1),
            }
          : item
      )
    );
  };

  const deleteItem = (id: number) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  useEffect(() => {
    const total = items.reduce((acc, item) => acc + item.totalPrice, 0);
    setGrandTotal(total);

    const details: Record<number, UserDetail> = {};
    items.forEach((item) => {
      item.consumers.forEach((uid) => {
        if (!details[uid]) details[uid] = { total: 0, items: [] };
        details[uid].items.push({ name: item.name, share: item.splitAmount });
        details[uid].total += item.splitAmount;
      });
    });
    setUserDetails(details);
  }, [items]);

  const getUserName = (id: number) =>
    users.find((u) => u.id === id)?.username || `User ${id}`;
  const handleSubmit = async () => {
    const { url } = await generateBillPdf({
      billDate,
      venue,
      grandTotal,
      userDetails,
    });
    setPdfUrl((prev) => ({
      ...prev,
      bill: url,
    }));
    setPreview(true);
  };

  // Prepare options for all users
  const allUserOptions = users.map((u) => ({
    value: u.id,
    label: u.username || u.name || u.email,
  }));

  // Function to select all consumers for an item
  const selectAllConsumers = (itemId: string) => {
    const selected = allUserOptions;
    handleConsumersChange(itemId, selected);
  };

  return (
    <div className="container max-w-5xl mx-auto p-6 space-y-8 bg-white dark:bg-gray-800 rounded-2xl shadow">
      <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-400">
        Bill Split
      </h2>
      {/* ✅ Date & Venue */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col space-y-2">
          <Label>Bill Date</Label>
          <Input
            type="date"
            value={billDate}
            onChange={(e) => setBillDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col space-y-2">
          <Label>Venue</Label>
          <Input
            placeholder="Enter Venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
          />
        </div>
      </div>

      {/* Item List */}
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow p-4 sm:p-5 space-y-4"
        >
          {/* Grid: Stack on mobile, 2 cols on small, 4 cols on medium+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col space-y-2">
              <Label>Item Name</Label>
              <Input
                value={item.name}
                onChange={(e) => updateItem(item.id, "name", e.target.value)}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) =>
                  updateItem(item.id, "quantity", e.target.value)
                }
              />
            </div>
            <div className="flex flex-col space-y-2">
              <Label>Unit Price</Label>
              <Input
                type="number"
                value={item.unitPrice}
                onChange={(e) =>
                  updateItem(item.id, "unitPrice", e.target.value)
                }
              />
            </div>
            <div className="flex flex-col space-y-2">
              <Label>Total</Label>
              <div className="flex items-center justify-center font-semibold bg-gray-100 dark:bg-gray-600 rounded p-2">
                ₹{item.totalPrice.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Consumers Multi-Select */}
          <div className="space-y-2">
            <Label>Select Consumers</Label>

            <MultiSelectWithCheckboxes
              itemId={item.id}
              selectedUserIds={item.consumers}
              onChange={handleConsumersChange}
            />
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Split Amount Per User:{" "}
              <span className="font-medium">
                ₹{item.splitAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="text-right">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteItem(item.id)}
            >
              Remove Item
            </Button>
          </div>
        </div>
      ))}
      <Button variant="primary_outline" onClick={addItem}>
        + Add Item
      </Button>

      {/* Grand Total */}
      <div className="text-right mt-4">
        <div className="inline-block px-6 py-3 rounded bg-gray-100 dark:bg-gray-700 font-bold">
          Grand Total: ₹{grandTotal.toFixed(2)}
        </div>
      </div>

      {/* User-wise Bill */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">User-wise Bill Details</h3>
        {Object.keys(userDetails).length === 0 && (
          <p className="text-sm text-gray-500">No users selected yet.</p>
        )}
        <div className="space-y-4">
          {Object.entries(userDetails).map(([uid, detail]) => (
            <div
              key={uid}
              className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 shadow"
            >
              <div className="flex justify-between font-medium">
                <span>{getUserName(parseInt(uid))}</span>
                <span className="text-blue-600 dark:text-blue-400">
                  ₹{detail.total.toFixed(2)}
                </span>
              </div>
              <ul className="ml-5 mt-2 text-sm list-disc text-gray-600 dark:text-gray-300">
                {detail.items.map((itm, idx) => (
                  <li key={idx} className="flex justify-between pr-2">
                    <span>{itm.name}</span>
                    <span>₹{itm.share.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mt-4">
        <Button variant="primary" onClick={handleSubmit}>
          Print Bill
        </Button>
      </div>
      {preview && (
        <ShowPdf
          open={preview}
          onOpenChange={setPreview}
          pdfUrl={pdfUrl.bill}
        />
      )}
    </div>
  );
};

const allUserOptions = userList.map((u) => ({
  value: u.id,
  label: u.username || u.name || u.email,
}));

// Custom Option with checkbox
const Option = (props: any) => {
  return (
    <components.Option {...props}>
      <input
        type="checkbox"
        checked={props.isSelected}
        onChange={() => null} // handled by react-select
        style={{ marginRight: 8 }}
      />
      {props.label}
    </components.Option>
  );
};

interface MultiSelectProps {
  itemId: number;
  selectedUserIds: number[];
  onChange: (
    itemId: number,
    selected: { value: number; label: string }[]
  ) => void;
}

function MultiSelectWithCheckboxes({
  itemId,
  selectedUserIds,
  onChange,
}: MultiSelectProps) {
  // Map selected IDs to full option objects
  const selectedUsers = allUserOptions.filter((u) =>
    selectedUserIds.includes(u.value)
  );

  return (
    <Select
      isMulti
      options={allUserOptions}
      value={selectedUsers}
      onChange={(selected) => onChange(itemId, selected)}
      closeMenuOnSelect={false}
      hideSelectedOptions={false}
      components={{ Option }}
    />
  );
}
export default BillSplit;

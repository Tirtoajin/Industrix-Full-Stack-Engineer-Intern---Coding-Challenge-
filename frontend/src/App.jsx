import React, { useState, useEffect, createContext, useContext } from "react";
import { Table, Button, Modal, Form, Input, Checkbox, Select, message, Space, Tag, Card, List, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, SettingOutlined } from "@ant-design/icons";
import axios from "axios";

// --- 1. SETUP & CONTEXT ---
const api = axios.create({ baseURL: "http://localhost:8080/api" });
const TodoContext = createContext();

const TodoProvider = ({ children }) => {
  const [todos, setTodos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchTodos = async (page = 1, search = "") => {
    setLoading(true);
    try {
      const res = await api.get(`/todos?page=${page}&limit=${pagination.pageSize}&search=${search}`);
      setTodos(res.data.data);
      setPagination({ ...pagination, current: page, total: res.data.total });
      fetchCategories();
    } catch (error) {
      message.error("Gagal koneksi server");
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (error) {}
  };

  const saveTodo = async (values, isEdit, id) => {
    try {
      if (isEdit) await api.put(`/todos/${id}`, values);
      else await api.post("/todos", { ...values, completed: false });
      message.success("Berhasil disimpan!");
      return true;
    } catch (error) {
      return false;
    }
  };

  const toggleStatus = async (record, checked) => {
    try {
      await api.put(`/todos/${record.id}`, { ...record, completed: checked });
      return true;
    } catch (e) {
      return false;
    }
  };

  const deleteTodo = async (id) => {
    try {
      await api.delete(`/todos/${id}`);
      message.success("Dihapus");
      return true;
    } catch (e) {
      return false;
    }
  };

  const categoryAction = async (action, val) => {
    try {
      if (action === "add") await api.post("/categories", val);
      else await api.delete(`/categories/${val}`);
      fetchCategories();
      message.success(action === "add" ? "Kategori ditambah" : "Kategori dihapus");
      return true;
    } catch (e) {
      return false;
    }
  };

  return <TodoContext.Provider value={{ todos, categories, loading, pagination, fetchTodos, saveTodo, toggleStatus, deleteTodo, categoryAction }}>{children}</TodoContext.Provider>;
};

// --- 2. UI COMPONENT ---
const TodoAppContent = () => {
  const { todos, categories, loading, pagination, fetchTodos, saveTodo, toggleStatus, deleteTodo, categoryAction } = useContext(TodoContext);
  const [modals, setModals] = useState({ todo: false, category: false });
  const [editingTodo, setEditingTodo] = useState(null);
  const [form] = Form.useForm();
  const [catForm] = Form.useForm();

  useEffect(() => {
    fetchTodos(1, "");
  }, []);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (await saveTodo(values, !!editingTodo, editingTodo?.id)) {
      setModals({ ...modals, todo: false });
      form.resetFields();
      fetchTodos(pagination.current, "");
    }
  };

  const getPriorityColor = (p) => {
    if (p === "high") return "red";
    if (p === "medium") return "orange";
    return "green";
  };

  const columns = [
    {
      title: "",
      dataIndex: "completed",
      width: 50,
      render: (v, r) => (
        <Checkbox
          checked={v}
          onChange={(e) => {
            toggleStatus(r, e.target.checked).then(() => fetchTodos(pagination.current, ""));
          }}
        />
      ),
    },
    {
      title: "DETAIL TUGAS",
      dataIndex: "title",
      render: (t, r) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontWeight: "bold",
              fontSize: "15px",
              textDecoration: r.completed ? "line-through" : "none",
              color: r.completed ? "#999" : "#333",
            }}
          >
            {t}
          </span>
          {r.description && <span style={{ fontSize: "13px", color: "#888", marginTop: "2px" }}>{r.description}</span>}
        </div>
      ),
    },
    { title: "KATEGORI", dataIndex: "category", width: 150, render: (c) => <Tag color="blue">#{c}</Tag> },
    {
      title: "PRIORITAS",
      dataIndex: "priority",
      width: 120,
      render: (p) => <Tag color={getPriorityColor(p)}>{(p || "medium").toUpperCase()}</Tag>,
    },
    {
      title: "",
      width: 100,
      render: (_, r) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingTodo(r);
              form.setFieldsValue(r);
              setModals({ ...modals, todo: true });
            }}
          />
          <Popconfirm title="Hapus?" onConfirm={() => deleteTodo(r.id).then(() => fetchTodos(pagination.current, ""))}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 40, background: "#f9f9f9", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <Card bordered={false} style={{ width: 1000, borderRadius: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.03)" }} bodyStyle={{ padding: 0 }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0f0f0", display: "flex", gap: 10, alignItems: "center" }}>
          <h2 style={{ margin: 0, marginRight: "auto", fontSize: 18 }}>Daftar Tugas Saya</h2>
        </div>

        <div style={{ padding: "20px 24px 0", display: "flex", gap: 10 }}>
          <Input prefix={<SearchOutlined style={{ color: "#bbb" }} />} placeholder="Cari tugas..." onChange={(e) => fetchTodos(1, e.target.value)} style={{ flex: 1, borderRadius: 6 }} />
          <Button icon={<SettingOutlined />} onClick={() => setModals({ ...modals, category: true })}>
            Kategori
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingTodo(null);
              form.resetFields();
              setModals({ ...modals, todo: true });
            }}
          >
            Buat Baru
          </Button>
        </div>

        <Table columns={columns} dataSource={todos} rowKey="id" loading={loading} pagination={{ ...pagination, onChange: (p) => fetchTodos(p, "") }} style={{ marginTop: 20 }} />
      </Card>

      {/* Modal Todo */}
      <Modal title={editingTodo ? "Edit Tugas" : "Tugas Baru"} open={modals.todo} onOk={handleSubmit} onCancel={() => setModals({ ...modals, todo: false })} centered>
        <Form form={form} layout="vertical" initialValues={{ priority: "medium" }}>
          <Form.Item name="title" label="Judul Tugas" rules={[{ required: true }]}>
            <Input size="large" placeholder="Mau mengerjakan apa?" />
          </Form.Item>
          <Form.Item name="description" label="Catatan / Deskripsi">
            <Input.TextArea rows={3} placeholder="Detail tambahan..." />
          </Form.Item>
          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item name="category" label="Kategori" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select placeholder="Pilih">
                {categories.map((c) => (
                  <Select.Option key={c.id} value={c.name}>
                    {c.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="priority" label="Prioritas" style={{ flex: 1 }}>
              <Select>
                <Select.Option value="high">🔴 High</Select.Option>
                <Select.Option value="medium">🟠 Medium</Select.Option>
                <Select.Option value="low">🟢 Low</Select.Option>
              </Select>
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* Modal Kategori */}
      <Modal title="Kelola Kategori" open={modals.category} footer={null} onCancel={() => setModals({ ...modals, category: false })}>
        <Form
          form={catForm}
          layout="inline"
          onFinish={async (val) => {
            if (await categoryAction("add", val)) catForm.resetFields();
          }}
          style={{ marginBottom: 20 }}
        >
          <Form.Item name="name" rules={[{ required: true }]} style={{ flex: 1 }}>
            <Input placeholder="Nama kategori..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Tambah
            </Button>
          </Form.Item>
        </Form>
        <List
          dataSource={categories}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Popconfirm title="Hapus?" onConfirm={() => categoryAction("delete", item.id)}>
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>,
              ]}
            >
              {item.name}
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

const App = () => (
  <TodoProvider>
    <TodoAppContent />
  </TodoProvider>
);
export default App;

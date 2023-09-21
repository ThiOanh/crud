import React, { useCallback, useState, useEffect } from "react";
import {
  Table,
  Button,
  Form,
  message,
  Alert,
  Popconfirm,
  Space,
  Modal,
  Pagination,
} from "antd";

import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import CategoryForm from "../../components/CategoryForm";
import axiosClient from "../../libraries/axiosClient";

const MESSAGE_TYPE = {
  SUCCESS: "success",
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
};

export default function CategoryPage() {
  const [createForm] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [updateForm] = Form.useForm();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const DEFAULT_LIMIT = 5;
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: DEFAULT_LIMIT,
  });
  const onShowMessage = useCallback(
    (content, type = MESSAGE_TYPE.SUCCESS) => {
      messageApi.open({
        type: type,
        content: content,
      });
    },
    [messageApi]
  );

  const getCategories = useCallback(async () => {
    try {
      const res = await axiosClient.get(
        `/categories?page=${pagination.page}&pageSize=${pagination.pageSize}`
      );
      setCategories(res.data.payload);
      setPagination((prev) => ({
        ...prev,
        total: res.data.total,
      }));
    } catch (error) {
      console.log(error);
    }
  }, [pagination.page, pagination.pageSize]);

  const onChangePage = useCallback(
    (page, pageSize) => {
      setPagination((prev) => ({
        ...prev,
        page,
        pageSize,
      }));

      getCategories();
    },
    [getCategories]
  );

  useEffect(() => {
    getCategories();
  }, [getCategories, refresh]);

  const onFinish = useCallback(
    async (values) => {
      try {
        const res = await axiosClient.post("/categories", {
          ...values,
          isDeleted: false,
        });

        setRefresh((preState) => preState + 1);
        createForm.resetFields();

        onShowMessage(res.data.message);
      } catch (error) {
        if (error?.response?.data?.errors) {
          error.response.data.errors.map((e) =>
            onShowMessage(e, MESSAGE_TYPE.ERROR)
          );
        }
      }
    },
    [createForm, onShowMessage]
  );
  const onSelectCategory = useCallback(
    (data) => () => {
      setEditModalVisible(true);

      setSelectedCategory(data);

      updateForm.setFieldsValue(data);
    },
    [updateForm]
  );
  const onDeleteCategory = useCallback(
    (categotyId) => async () => {
      try {
        const response = await axiosClient.patch(
          `categories/delete/${categotyId}`
        );

        onShowMessage(response.data.message);

        setRefresh((prevState) => prevState + 1);
      } catch (error) {
        console.log("««««« error »»»»»", error);
      }
    },
    [onShowMessage]
  );

  const onEditFinish = useCallback(
    async (values) => {
      try {
        const response = await axiosClient.put(
          `categories/${selectedCategory._id}`,
          values,
        );

        updateForm.resetFields();

        setEditModalVisible(false);

        onShowMessage(response.data.message);

        const newList = categories.map((item) => {
          if (item._id === selectedCategory._id) {
            return {
              ...item,
              ...values,
            };
          } 
          return item;
        })

        setCategories(newList);

        // setRefresh((prevState) => prevState + 1);
      } catch (error) {
        console.log('««««« error »»»»»', error);
      }
    },
    [onShowMessage, categories, selectedCategory?._id, updateForm],
  );
  const columns = [
    {
      title: "No",
      dataIndex: "No",
      key: "no",
      width: "1%",
      render: function (text, record, index) {
        return (
          <span>{index + 1 + pagination.pageSize * (pagination.page - 1)}</span>
        );
      },
    },
    {
      title: "Tên danh mục",
      dataIndex: "name",
      key: "name",
      render: function (text, record) {
        return <Link to={`${record._id}`}>{text}</Link>;
      },
    },

    {
      title: "Mô tả",
      key: "description",
      dataIndex: "description",
    },

    {
      title: "Hành động",
      key: "actions",
      width: "1%",
      render: (text, record, index) => {
        return (
          <Space>
            <Button
              type="dashed"
              icon={<EditOutlined />}
              onClick={onSelectCategory(record)}
            />

            <Popconfirm
              title="bạn có muốn xóa không"
              okText="Đồng ý"
              cancelText="Hủy"
              onConfirm={onDeleteCategory(record._id)}
            >
              <Button danger type="dashed" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <>
     <div>
        <Link to="/products">
          <Button type="primary">Product</Button>
        </Link>
        <Link to="/categories">
          <Button type="primary">Category</Button>
        </Link>
        <Link to="/suppliers">
          <Button type="primary">Supplier</Button>
        </Link>
      </div>
      {contextHolder}
      <CategoryForm
        form={createForm}
        onFinish={onFinish}
        formName="add-category-form"
        optionStyle={{
          maxWidth: 900,
          margin: "60px auto",
        }}
      />
      <Table
        rowKey="_id"
        dataSource={categories}
        columns={columns}
        pagination={false}
      />
      <Pagination
        defaultCurrent={1}
        total={pagination.total}
        pageSize={DEFAULT_LIMIT}
        onChange={onChangePage}
        current={pagination.page}
      />

      <Modal
        open={editModalVisible}
        centered
        title="Cập nhật thông tin"
        onCancel={() => {
          setEditModalVisible(false);
        }}
        cancelText="Đóng"
        okText="Lưu"
        onOk={() => {
          updateForm.submit();
        }}
      >
        <CategoryForm
          form={updateForm}
          categories={categories}
          onFinish={onEditFinish}
          formName="update-category"
         
        />
      </Modal>
    </>
  );
}

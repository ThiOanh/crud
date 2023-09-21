import React, { useCallback, useState,  useEffect } from 'react';
import {
  Table,
  Form,
  message,
  Pagination,
  Popconfirm,
  Space,
  Button,
  Modal,
} from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import axiosClient from '../../libraries/axiosClient';
import SupplierForm from '../../components/SupplierForm';

const MESSAGE_TYPE = {
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
};

export default function SuppliersPage() {
  const [createForm] = Form.useForm();
  const [suppliers, setSuppliers] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [refresh, setRefresh] = useState(0);
  const [updateForm] = Form.useForm();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

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
    [messageApi],
  );

  const getSuppliers = useCallback(async () => {
    try {
      const res = await axiosClient.get(`/suppliers?page=${pagination.page}&pageSize=${pagination.pageSize}`);
      setSuppliers(res.data.payload);
      setPagination((prev) => ({
        ...prev,
        total: res.data.total,
      }))
    } catch (error) {
      console.log(error);
    }
  }, [pagination.page, pagination.pageSize]);

  const onChangePage = useCallback((page, pageSize) => {
    setPagination((prev) => ({
      ...prev,
      page,
      pageSize,
    }));

    getSuppliers();
  }, [getSuppliers]);

  useEffect(() => {
    getSuppliers();
  }, [getSuppliers, refresh]);

  const onFinish = useCallback(
    async (values) => {
      try {
        const res = await axiosClient.post('/suppliers', {
          ...values,
          isDeleted: false,
        });

        setRefresh((preState) => preState + 1);
        createForm.resetFields();

        onShowMessage(res.data.message);
      } catch (error) {
        if (error?.response?.data?.errors) {
          error.response.data.errors.map((e) =>
            onShowMessage(e, MESSAGE_TYPE.ERROR),
          );
        }
      }
    },
    [createForm, onShowMessage],
  );

  const onSelectSupplier = useCallback(
    (data) => () => {
      setEditModalVisible(true);

      setSelectedSupplier(data);

      updateForm.setFieldsValue(data);
    },
    [updateForm],
  );
  const onDeleteSupplier = useCallback(
    (supplierId) => async () => {
      try {
        const response = await axiosClient.patch(`suppliers/delete/${supplierId}`);

        onShowMessage(response.data.message);

        setRefresh((prevState) => prevState + 1);
      } catch (error) {
        console.log('««««« error »»»»»', error);
      }
    },
    [onShowMessage],
  );
  const onEditFinish = useCallback(
    async (values) => {
      try {
        const response = await axiosClient.put(
          `suppliers/${selectedSupplier._id}`,
          values,
        );

        updateForm.resetFields();

        setEditModalVisible(false);

        onShowMessage(response.data.message);

        const newList = suppliers.map((item) => {
          if (item._id === selectedSupplier._id) {
            return {
              ...item,
              ...values,
            };
          } 
          return item;
        })

        setSuppliers(newList);

        // setRefresh((prevState) => prevState + 1);
      } catch (error) {
        console.log('««««« error »»»»»', error);
      }
    },
    [onShowMessage, suppliers, selectedSupplier?._id, updateForm],
  );

  const columns = [
    {
    title: 'No',
    dataIndex: 'No',
    key: 'no',
    width: '1%',
    render: function (text, record, index) {
      return <span>{(index + 1) + (pagination.pageSize * (pagination.page - 1))}</span>;
    }
  },
  {
    title: 'Tên nhà cung cấp',
    dataIndex: 'name',
    key: 'name',
    render: function (text, record) {
      return (
        <Link to={`${record._id}`}>
            {text}
          </Link>
      );
    },
  },

  {
    title: 'Email',
    key: 'email',
    dataIndex: 'email',
  },
  {
    title: 'Số điện thoại ',
    key: 'phoneNumber',
    dataIndex: 'phoneNumber',
  },
  {
    title: 'Địa chỉ',
    key: 'address',
    dataIndex: 'address',
  },
 

  {
    title: 'Hành động',
    key: 'actions',
    width: '1%',
    render: (text, record, index) => {
      return (
        <Space>
          <Button
            type="dashed"
            icon={<EditOutlined />}
            onClick={onSelectSupplier(record)}
          />

          <Popconfirm
            title="bạn có muốn xóa không"
            okText="Đồng ý"
            cancelText="Hủy"
            onConfirm={onDeleteSupplier(record._id)}
          >
            <Button danger type="dashed" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      );
    },
  },
   ]

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

      <SupplierForm
        form={createForm}
        onFinish={onFinish}
        formName="add-supplier-form"
        optionStyle={{
          maxWidth: 900,
          margin: '60px auto',
        }}
      />
      <Table
        rowKey="_id"
        dataSource={suppliers}
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
        <SupplierForm
        form={updateForm}
        onFinish={onEditFinish}
        formName="add-supplier-form"
      />
      </Modal>
    </>
  )
}

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Form, Popconfirm, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import numeral from 'numeral';
import 'numeral/locales/vi';

import axiosClient from '../../libraries/axiosClient';
import CategoryForm from '../../components/CategoryForm';
import { LOCATIONS } from 'constants/index';

const MESSAGE_TYPE = {
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
};

numeral.locale('vi');

export default function CategoryDetail() {
  const params = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [categoryForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const onShowMessage = useCallback(
    (content, type = MESSAGE_TYPE.SUCCESS) => {
      messageApi.open({
        type: type,
        content: content,
      });
    },
    [messageApi],
  );

  const onDeleteCategory = useCallback(async () => {
    try {
      const response = await axiosClient.patch(`categories/delete/${params.id}`);

      onShowMessage(response.data.message);

      navigate(LOCATIONS.CATEGORIES);
    } catch (error) {
      console.log('««««« error »»»»»', error);
    }
  }, [navigate, onShowMessage, params.id]);


  const getCategories = useCallback(async () => {
    try {
      const res = await axiosClient.get('/categories');
      setCategories(res.data.payload || []);
    } catch (error) {
      console.log(error);
    }
  }, []);

  const getCategoryData = useCallback(async () => {
    try {
      const res = await axiosClient.get(`/categories/${params.id}`);

      categoryForm.setFieldsValue(res.data.payload);
    } catch (error) {
      console.log(error);
    }
  }, [params.id, categoryForm]);

  useEffect(() => {

    getCategories();
  }, [getCategories]);

  const isEditCategory = useMemo(() => !(params.id === 'add'), [params.id]);

  const onAddCategory = useCallback(
    async (values) => {
      try {
        const res = await axiosClient.post('/Categories', values);

        categoryForm.resetFields();

        onShowMessage(res.data.message);

        navigate(LOCATIONS.CATEGORIES)
      } catch (error) {
        if (error?.response?.data?.errors) {
          error.response.data.errors.map((e) =>
            onShowMessage(e, MESSAGE_TYPE.ERROR),
          );
        }
      }
    },
    [navigate, onShowMessage, categoryForm],
  );

  useEffect(() => {
    if (isEditCategory) {
      getCategoryData();
    }
  }, [getCategoryData, isEditCategory, params.id]);

  return (
    <>
      {contextHolder}

      <CategoryForm
        form={categoryForm}
        suppliers={suppliers}
        categories={categories}
        formName="product-form"
        optionStyle={{
          maxWidth: 900,
          margin: '60px auto',
        }}
        onFinish={onAddCategory}
      />

      {isEditCategory && (
        <Popconfirm
          title="Are you sure to delete?"
          okText="Đồng ý"
          cancelText="Đóng"
          onConfirm={onDeleteCategory}
        >
          <Button danger type="dashed" icon={<DeleteOutlined />}>
            Xóa
          </Button>
        </Popconfirm>
      )}
    </>
  );
}
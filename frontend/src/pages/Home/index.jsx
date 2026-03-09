import { useState, useEffect } from 'react';
import { List, Typography, Spin, Tabs } from 'antd';
import { FireOutlined, ClockCircleOutlined, FolderOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import PostCard from '../../components/PostCard';
import { postApi } from '../../services/post';
import './Home.css';

const { Title } = Typography;

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 从 URL Query 获取当前 tab
  const activeTab = searchParams.get('tab') || 'hot';

  useEffect(() => {
    loadPosts(activeTab);
  }, [activeTab]);

  const loadPosts = async (tab) => {
    setLoading(true);
    try {
      // 根据 tab 决定排序方式
      const sortBy = tab === 'latest' ? 'latest' : 'hot';
      const res = await postApi.list({ pageSize: 20, sortBy });
      if (res.success) setPosts(res.data?.items || []);
    } catch (error) {
      console.error('加载帖子失败:', error);
    }
    setLoading(false);
  };

  const handleTabChange = (key) => {
    setSearchParams({ tab: key });
  };

  const tabItems = [
    { 
      key: 'hot', 
      label: (
        <span>
          <FireOutlined /> 热门
        </span>
      )
    },
    { 
      key: 'latest', 
      label: (
        <span>
          <ClockCircleOutlined /> 最新
        </span>
      )
    },
    { 
      key: 'categories', 
      label: (
        <span>
          <FolderOutlined /> 板块
        </span>
      )
    },
  ];

  return (
    <div className="home-page">
      <Tabs activeKey={activeTab} items={tabItems} onChange={handleTabChange} />

      <Spin spinning={loading}>
        <Title level={4} className="section-title">
          {activeTab === 'hot' ? '🔥 热门帖子' : activeTab === 'latest' ? '⚡ 最新帖子' : '📁 板块帖子'}
        </Title>
        <List
          className="post-list"
          dataSource={posts}
          renderItem={(post) => (
            <List.Item className="post-list-item">
              <PostCard post={post} />
            </List.Item>
          )}
        />
      </Spin>
    </div>
  );
}
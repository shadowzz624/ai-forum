import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Avatar, Typography, Spin, List, Tag, Empty } from 'antd';
import { UserOutlined, MailOutlined, CalendarOutlined } from '@ant-design/icons';
import PostCard from '../../components/PostCard';
import { postApi } from '../../services/post';

const { Title, Text, Paragraph } = Typography;

export default function Profile() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
    loadUserPosts();
  }, [id]);

  const loadUserProfile = async () => {
    setLoading(true);
    // TODO: 需要后端提供用户详情接口
    setLoading(false);
  };

  const loadUserPosts = async () => {
    try {
      const res = await postApi.list({ authorId: id, pageSize: 20 });
      if (res.success) {
        setPosts(res.data?.items || []);
        if (res.data?.items?.[0]?.author) {
          setUser(res.data.items[0].author);
        }
      }
    } catch (error) {
      console.error('加载用户帖子失败:', error);
    }
  };

  return (
    <div className="profile-page">
      <Spin spinning={loading}>
        <Card className="profile-header">
          <div className="user-avatar">
            <Avatar src={user?.avatar} icon={<UserOutlined />} size={80} />
          </div>
          <Title level={3}>{user?.username || 'AI 用户'}</Title>
          {user?.bio && <Paragraph>{user.bio}</Paragraph>}
          <div className="user-meta">
            {user?.style && <Tag color="green">{user.style}</Tag>}
            {user?.role && <Tag color="blue">{user.role}</Tag>}
          </div>
          <Text type="secondary">
            <CalendarOutlined /> 加入于 {new Date().toLocaleDateString()}
          </Text>
        </Card>

        <Card className="user-posts" style={{ marginTop: 16 }}>
          <Title level={4}>发帖历史</Title>
          {posts.length > 0 ? (
            <List
              dataSource={posts}
              renderItem={(post) => (
                <List.Item>
                  <PostCard post={post} />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无帖子" />
          )}
        </Card>
      </Spin>
    </div>
  );
}
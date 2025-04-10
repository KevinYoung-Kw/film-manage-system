'use client';

import React, { useState, useEffect } from 'react';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card } from '@/app/components/ui/Card';
import { ChevronDown, ChevronUp, Search, Phone, Mail } from 'lucide-react';
import supabase from '@/app/lib/services/supabaseClient';

// 定义FAQ和SiteInfo接口
interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

interface SiteInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  copyright: string;
  workingHours: string;
}

export default function FAQPage() {
  const [openFAQs, setOpenFAQs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [siteInfo, setSiteInfo] = useState<SiteInfo>({
    name: '电影票务系统',
    address: '中国某省某市某区某街道123号',
    phone: '400-123-4567',
    email: 'support@example.com',
    copyright: '© 2025 电影票务系统',
    workingHours: '09:00 - 22:00'
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // 获取FAQs数据
    const fetchFAQs = async () => {
      try {
        setLoading(true);
        const { data: faqsData, error: faqsError } = await supabase
          .from('faqs')
          .select('*')
          .order('id');
          
        if (faqsError) {
          console.error('获取FAQs失败:', faqsError);
          return;
        }
        
        if (faqsData) {
          setFaqs(faqsData);
        }
        
        // 获取网站信息
        const { data: siteData, error: siteError } = await supabase
          .from('site_info')
          .select('*')
          .single();
          
        if (siteError && siteError.code !== 'PGRST116') {
          console.error('获取网站信息失败:', siteError);
        }
        
        if (siteData) {
          setSiteInfo(siteData);
        }
      } catch (error) {
        console.error('获取数据出错:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFAQs();
  }, []);
  
  const toggleFAQ = (id: string) => {
    if (openFAQs.includes(id)) {
      setOpenFAQs(openFAQs.filter(faqId => faqId !== id));
    } else {
      setOpenFAQs([...openFAQs, id]);
    }
  };
  
  const filteredFAQs = searchQuery 
    ? faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;
  
  return (
    <MobileLayout title="常见问题">
      {/* 搜索框 */}
      <div className="px-4 py-3 sticky top-0 bg-slate-50 z-10">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="搜索常见问题..."
            className="block w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* FAQ列表 */}
      <div className="px-4 py-2">
        <h2 className="text-lg font-semibold mb-4">常见问题</h2>
        
        {loading ? (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-slate-500">加载中...</p>
          </div>
        ) : filteredFAQs.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-slate-500">未找到相关问题</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFAQs.map((faq) => (
              <Card key={faq.id} className="overflow-hidden">
                <div 
                  className="p-4 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleFAQ(faq.id)}
                >
                  <h3 className="font-medium">{faq.question}</h3>
                  {openFAQs.includes(faq.id) ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
                
                {openFAQs.includes(faq.id) && (
                  <div className="px-4 pb-4 pt-0 text-slate-600 text-sm border-t border-slate-100">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* 联系我们 */}
      <div className="px-4 py-6 mt-4">
        <h2 className="text-lg font-semibold mb-4">联系我们</h2>
        <Card className="p-4">
          <p className="text-sm text-slate-600 mb-4">
            如果您没有找到想要的答案，请随时通过以下方式与我们联系：
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <Phone className="h-5 w-5 text-indigo-500 mr-3" />
              <div>
                <p className="text-sm font-medium">电话咨询</p>
                <p className="text-sm text-slate-500">{siteInfo.phone}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-indigo-500 mr-3" />
              <div>
                <p className="text-sm font-medium">邮件咨询</p>
                <p className="text-sm text-slate-500">{siteInfo.email}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* 底部信息 */}
      <div className="text-center p-4 text-xs text-slate-400">
        <p>{siteInfo.copyright}</p>
        <p className="mt-1">服务时间: {siteInfo.workingHours}</p>
      </div>
    </MobileLayout>
  );
} 
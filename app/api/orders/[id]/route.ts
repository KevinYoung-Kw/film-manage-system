import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/app/lib/services/orderService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: orderId } = params;

    if (!orderId) {
      return NextResponse.json({ error: '订单ID不能为空' }, { status: 400 });
    }

    const order = await OrderService.getOrderById(orderId);

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('获取订单详情失败:', error);
    return NextResponse.json(
      { error: `获取订单失败: ${error.message}` },
      { status: 500 }
    );
  }
} 
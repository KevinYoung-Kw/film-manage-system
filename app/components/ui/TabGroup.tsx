'use client';

import React from 'react';
import { Tab } from '@headlessui/react';
import classNames from 'classnames';

interface TabItem {
  key: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabGroupProps {
  tabs: TabItem[];
  defaultIndex?: number;
  onChange?: (index: number) => void;
  className?: string;
  variant?: 'underline' | 'pills' | 'box';
  fullWidth?: boolean;
}

const TabGroup: React.FC<TabGroupProps> = ({
  tabs,
  defaultIndex = 0,
  onChange,
  className,
  variant = 'underline',
  fullWidth = false,
}) => {
  const variantStyles = {
    underline: {
      list: 'flex border-b border-slate-200',
      tab: (selected: boolean) =>
        classNames(
          'py-2 px-4 text-sm font-medium focus:outline-none transition-colors',
          selected
            ? 'text-indigo-600 border-b-2 border-indigo-600'
            : 'text-slate-500 hover:text-slate-700 hover:border-b-2 hover:border-slate-300'
        ),
    },
    pills: {
      list: 'flex space-x-2',
      tab: (selected: boolean) =>
        classNames(
          'py-2 px-4 text-sm font-medium rounded-md focus:outline-none transition-colors',
          selected
            ? 'bg-indigo-100 text-indigo-700'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
        ),
    },
    box: {
      list: 'flex border border-slate-200 rounded-md p-1 bg-slate-50',
      tab: (selected: boolean) =>
        classNames(
          'py-2 px-4 text-sm font-medium rounded-md focus:outline-none transition-colors',
          selected
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        ),
    },
  };

  return (
    <div className={className}>
      <Tab.Group defaultIndex={defaultIndex} onChange={onChange}>
        <Tab.List
          className={classNames(variantStyles[variant].list, fullWidth && 'w-full')}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.key}
              disabled={tab.disabled}
              className={({ selected }) =>
                classNames(
                  variantStyles[variant].tab(selected),
                  fullWidth && 'flex-1 text-center',
                  tab.disabled && 'opacity-50 cursor-not-allowed'
                )
              }
            >
              {tab.label}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-4">
          {tabs.map((tab) => (
            <Tab.Panel key={tab.key}>{tab.content}</Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default TabGroup; 
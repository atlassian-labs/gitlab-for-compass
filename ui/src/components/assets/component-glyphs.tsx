/* eslint-disable max-len */
/* eslint-disable @atlaskit/design-system/ensure-design-token-usage */

import React from 'react';

import { CustomGlyphProps } from '@atlaskit/icon/types';
import * as colors from '@atlaskit/theme/colors';
import { token } from '@atlaskit/tokens';
import { ComponentTypeData } from './types';

export const COMPONENT_TYPES: ComponentTypeData[] = [
  {
    id: 'SERVICE',
    label: 'Service',
    color: token('color.icon.accent.purple', colors.P300),
    icon: (props: CustomGlyphProps) => (
      <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
        <path
          fillRule='evenodd'
          clipRule='evenodd'
          d='M17.714 5a1.286 1.286 0 1 0 0 2.571 1.286 1.286 0 0 0 0-2.571Zm-3.143.327A3.287 3.287 0 0 1 21 6.286a3.286 3.286 0 0 1-6.43.958 1 1 0 0 1-.284.042h-1.72L9.738 12l2.828 4.714h1.72a1 1 0 0 1 .285.041 3.287 3.287 0 0 1 6.429.96 3.286 3.286 0 0 1-6.43.958 1 1 0 0 1-.284.041H12a1 1 0 0 1-.857-.485L8.005 13H4a1 1 0 0 1 0-2h4.005l3.137-5.229A1 1 0 0 1 12 5.286h2.286a1 1 0 0 1 .285.04Zm3.143 11.101a1.286 1.286 0 1 0 0 2.572 1.286 1.286 0 0 0 0-2.572Z'
          fill='#fff'
        />
      </svg>
    ),
    fieldDefinitionIds: ['compass:lifecycle', 'compass:tier'],
  },
  {
    id: 'LIBRARY',
    label: 'Library',
    color: token('color.icon.accent.yellow', colors.Y500),
    icon: (props: CustomGlyphProps) => (
      <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
        <path
          fillRule='evenodd'
          clipRule='evenodd'
          d='M7.21667 5C5.80834 5 4.66667 6.14167 4.66667 7.55V11H4.05C3.4701 11 3 11.4701 3 12.05C3 12.6299 3.4701 13.1 4.05 13.1H4.66667V16.55C4.66667 17.9583 5.80834 19.1 7.21667 19.1H9.05C9.6299 19.1 10.1 18.6299 10.1 18.05C10.1 17.4701 9.6299 17 9.05 17H7.21667C6.96814 17 6.76667 16.7985 6.76667 16.55V12.05V7.55C6.76667 7.30147 6.96814 7.1 7.21667 7.1H9.05C9.6299 7.1 10.1 6.6299 10.1 6.05C10.1 5.4701 9.6299 5 9.05 5H7.21667ZM16.8833 19.1C18.2917 19.1 19.4333 17.9583 19.4333 16.55V13.1H20.05C20.6299 13.1 21.1 12.6299 21.1 12.05C21.1 11.4701 20.6299 11 20.05 11H19.4333V7.55C19.4333 6.14167 18.2917 5 16.8833 5L15.05 5C14.4701 5 14 5.4701 14 6.05C14 6.6299 14.4701 7.1 15.05 7.1L16.8833 7.1C17.1319 7.1 17.3333 7.30147 17.3333 7.55V12.05L17.3333 16.55C17.3333 16.7985 17.1319 17 16.8833 17H15.05C14.4701 17 14 17.4701 14 18.05C14 18.6299 14.4701 19.1 15.05 19.1H16.8833Z'
          fill='#fff'
        />
      </svg>
    ),
    fieldDefinitionIds: ['compass:lifecycle'],
  },
  {
    id: 'APPLICATION',
    label: 'Application',
    color: token('color.icon.accent.green', colors.G300),
    icon: (props: CustomGlyphProps) => (
      <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
        <path
          fillRule='evenodd'
          clipRule='evenodd'
          d='M11.57 3.105a1 1 0 0 1 .894.001l3.985 2A1 1 0 0 1 17 6v4.375l3.449 1.731A1 1 0 0 1 21 13v5a1 1 0 0 1-.553.895l-4.004 2a1 1 0 0 1-.894 0l-3.55-1.777-3.556 1.777a1 1 0 0 1-.894 0l-3.997-2A1 1 0 0 1 3 18v-5a1 1 0 0 1 .554-.895L7 10.389V6a1 1 0 0 1 .554-.895l4.016-2Zm-3.563 9.017L5 13.619v3.763l2.997 1.5 3.003-1.5V13.62l-2.993-1.498ZM13 13.619v3.763l2.996 1.5 3.004-1.5v-3.765l-2.986-1.499L13 13.619Zm2-3.237V6.617l-2.986-1.499L9 6.619v3.756l3 1.506 3-1.5Z'
          fill='#fff'
        />
      </svg>
    ),
    fieldDefinitionIds: ['compass:lifecycle'],
  },
  {
    id: 'CAPABILITY',
    label: 'Capability',
    color: token('color.icon.accent.gray', colors.N600),
    icon: (props: CustomGlyphProps) => (
      <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
        <path
          fillRule='evenodd'
          clipRule='evenodd'
          d='M10.5145 6.15717C10.5145 6.97758 11.1796 7.64266 12 7.64266C12.8204 7.64266 13.4855 6.97758 13.4855 6.15717C13.4855 5.33676 12.8204 4.67168 12 4.67168C11.1796 4.67168 10.5145 5.33676 10.5145 6.15717ZM11.15 9.22799C10.8953 9.15765 10.6534 9.05647 10.4286 8.92873L8.93348 10.426C9.19656 10.8894 9.34679 11.4253 9.34679 11.9963C9.34679 13.7556 7.9206 15.1818 6.1613 15.1818C4.40201 15.1818 2.97581 13.7556 2.97581 11.9963C2.97581 10.237 4.40201 8.81083 6.1613 8.81083C6.73217 8.81083 7.26796 8.96099 7.73134 9.22398L9.22707 7.72612C8.96447 7.263 8.81454 6.72759 8.81454 6.15717C8.81454 4.39787 10.2407 2.97168 12 2.97168C13.7593 2.97168 15.1855 4.39787 15.1855 6.15717C15.1855 6.72831 15.0352 7.26434 14.772 7.72787L16.2683 9.22419C16.7318 8.96107 17.2677 8.81083 17.8387 8.81083C19.598 8.81083 21.0242 10.237 21.0242 11.9963C21.0242 13.7556 19.598 15.1818 17.8387 15.1818C16.0794 15.1818 14.6532 13.7556 14.6532 11.9963C14.6532 11.4255 14.8034 10.8897 15.0663 10.4264L13.5697 8.92972C13.3453 9.057 13.104 9.15784 12.85 9.228V14.7646C14.1966 15.1366 15.1855 16.3705 15.1855 17.8355C15.1855 19.5948 13.7593 21.021 12 21.021C10.2407 21.021 8.81454 19.5948 8.81454 17.8355C8.81454 16.3705 9.80338 15.1366 11.15 14.7646V9.22799ZM4.67581 11.9963C4.67581 12.8167 5.34089 13.4818 6.1613 13.4818C6.98172 13.4818 7.64679 12.8167 7.64679 11.9963C7.64679 11.1759 6.98172 10.5108 6.1613 10.5108C5.34089 10.5108 4.67581 11.1759 4.67581 11.9963ZM12 19.321C11.1796 19.321 10.5145 18.6559 10.5145 17.8355C10.5145 17.0151 11.1796 16.35 12 16.35C12.8204 16.35 13.4855 17.0151 13.4855 17.8355C13.4855 18.6559 12.8204 19.321 12 19.321ZM16.3532 11.9963C16.3532 12.8167 17.0183 13.4818 17.8387 13.4818C18.6591 13.4818 19.3242 12.8167 19.3242 11.9963C19.3242 11.1759 18.6591 10.5108 17.8387 10.5108C17.0183 10.5108 16.3532 11.1759 16.3532 11.9963Z'
          fill='#fff'
        />
      </svg>
    ),
    fieldDefinitionIds: ['compass:lifecycle', 'compass:tier'],
  },
  {
    id: 'CLOUD_RESOURCE',
    label: 'Cloud Resource',
    color: token('color.icon.accent.purple', colors.P300),
    icon: (props: CustomGlyphProps) => (
      <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
        <path
          fill='none'
          d='M6.07585 10.4798C4.70269 10.7573 3.66883 11.9708 3.66883 13.4258C3.66883 15.0857 4.83719 16.4314 6.49712 16.4314M16.6409 16.4314C18.9648 16.4314 20.5 14.5475 20.5 12.2236C20.5 9.89967 18.6161 8.01578 16.2922 8.01578C15.8909 8.01578 15.5027 8.07196 15.1351 8.17688M15.1399 8.18267C14.3348 6.65375 12.7302 5.61133 10.8822 5.61133C8.22631 5.61133 6.07329 7.76435 6.07329 10.4202V10.4803'
          stroke='#fff'
          strokeWidth='1.8'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          fill='none'
          d='M14.1963 16.4036C14.1963 17.8203 13.0479 18.9688 11.6312 18.9688C10.2146 18.9688 9.06612 17.8203 9.06612 16.4036C9.06612 14.987 10.2146 13.8385 11.6312 13.8385C13.0479 13.8385 14.1963 14.987 14.1963 16.4036Z'
          stroke='#fff'
          strokeWidth='1.8'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    ),
    fieldDefinitionIds: ['compass:lifecycle', 'compass:tier'],
  },
  {
    id: 'DATA_PIPELINE',
    label: 'Data Pipeline',
    color: token('color.icon.accent.red', colors.R300),
    icon: (props: CustomGlyphProps) => (
      <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
        <path
          fill='none'
          d='M5.42614 8.00584C6.57734 8.45806 7.87717 7.89141 8.32938 6.7402C8.78159 5.589 8.21495 4.28917 7.06374 3.83696C5.91254 3.38475 4.61271 3.95139 4.1605 5.1026C3.70828 6.2538 4.27493 7.55363 5.42614 8.00584Z'
          stroke='#fff'
          strokeWidth='1.7'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          fill='none'
          d='M16.9334 20.1997C18.0846 20.6519 19.3844 20.0853 19.8366 18.9341C20.2888 17.7828 19.7222 16.483 18.571 16.0308C17.4198 15.5786 16.12 16.1452 15.6677 17.2964C15.2155 18.4477 15.7822 19.7475 16.9334 20.1997Z'
          stroke='#fff'
          strokeWidth='1.7'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          fill='none'
          d='M6.24493 8.56055V11.0306C6.24493 11.5829 6.69264 12.0306 7.24493 12.0306H16.0659C16.6182 12.0306 17.0659 12.4784 17.0659 13.0306V15.2116'
          stroke='#fff'
          strokeWidth='1.8'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    ),
    fieldDefinitionIds: ['compass:lifecycle', 'compass:tier'],
  },
  {
    id: 'MACHINE_LEARNING_MODEL',
    label: 'Machine Learning Model',
    color: token('color.icon.accent.red', colors.R300),
    icon: (props: CustomGlyphProps) => (
      <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
        <path
          fill='none'
          d='M11.8555 3.01807L15.7255 5.31503L19.6497 7.51807L19.5955 12.0181L19.6497 16.5181L15.7255 18.7211L11.8555 21.0181L7.98547 18.7211L4.06124 16.5181L4.11547 12.0181L4.06124 7.51807L7.98547 5.31503L11.8555 3.01807Z'
          stroke='#fff'
          strokeWidth='1.5'
          strokeLinejoin='round'
        />
        <path fill='none' d='M4.61222 7.89078L18.8696 16.1906' stroke='#fff' strokeWidth='1.5' />
        <path fill='none' d='M4.85273 16.2901L19.0688 7.95921' stroke='#fff' strokeWidth='1.5' />
        <path fill='none' d='M11.7317 20.2989L11.7317 3.24756' stroke='#fff' strokeWidth='1.5' />
        <path
          fill='#FF5630'
          d='M10.7933 14.6374C12.1126 15.1556 13.6021 14.5062 14.1203 13.187C14.6385 11.8678 13.9892 10.3782 12.67 9.86003C11.3507 9.34181 9.86119 9.99116 9.34297 11.3104C8.82476 12.6296 9.47411 14.1192 10.7933 14.6374Z'
          stroke='#fff'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    ),
    fieldDefinitionIds: ['compass:lifecycle', 'compass:tier'],
  },
  {
    id: 'UI_ELEMENT',
    label: 'UI Element',
    color: token('color.icon.accent.yellow', colors.Y500),
    icon: (props: CustomGlyphProps) => (
      <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
        <mask id='path-1-inside-1_1403_23012' fill='white'>
          <rect x='2.83353' y='13.6489' width='6.97358' height='7.36887' rx='1' />
        </mask>
        <rect
          fill='none'
          x='2.83353'
          y='13.6489'
          width='6.97358'
          height='7.36887'
          rx='1'
          stroke='#fff'
          strokeWidth='3.2'
          mask='url(#path-1-inside-1_1403_23012)'
        />
        <mask id='path-2-inside-2_1403_23012' fill='white'>
          <rect x='2.83353' y='3.01807' width='18.5455' height='8.59702' rx='1' />
        </mask>
        <rect
          fill='none'
          x='2.83353'
          y='3.01807'
          width='18.5455'
          height='8.59702'
          rx='1'
          stroke='#fff'
          strokeWidth='3.2'
          mask='url(#path-2-inside-2_1403_23012)'
        />
        <mask id='path-3-inside-3_1403_23012' fill='white'>
          <rect x='11.5089' y='13.6489' width='9.87006' height='7.36887' rx='1' />
        </mask>
        <rect
          fill='none'
          x='11.5089'
          y='13.6489'
          width='9.87006'
          height='7.36887'
          rx='1'
          stroke='#fff'
          strokeWidth='3.2'
          mask='url(#path-3-inside-3_1403_23012)'
        />
      </svg>
    ),
    fieldDefinitionIds: ['compass:lifecycle', 'compass:tier'],
  },
  {
    id: 'WEBSITE',
    label: 'Website',
    color: token('color.icon.accent.green', colors.G300),
    icon: (props: CustomGlyphProps) => (
      <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
        <path
          fill='#fff'
          fillRule='evenodd'
          clipRule='evenodd'
          d='M12.3319 20.9136C13.5069 20.9136 14.6704 20.6821 15.756 20.2325C16.8416 19.7828 17.828 19.1237 18.6589 18.2928C19.4898 17.462 20.1489 16.4756 20.5985 15.39C21.0482 14.3044 21.2796 13.1409 21.2796 11.9658C21.2796 10.7908 21.0482 9.62725 20.5985 8.54166C20.1489 7.45607 19.4898 6.46968 18.6589 5.6388C17.828 4.80793 16.8416 4.14884 15.756 3.69917C14.6704 3.24951 13.5069 3.01807 12.3319 3.01807C9.95879 3.01807 7.68289 3.96077 6.00486 5.6388C4.32683 7.31683 3.38412 9.59273 3.38412 11.9658C3.38412 14.3389 4.32683 16.6148 6.00486 18.2928C7.68289 19.9709 9.95879 20.9136 12.3319 20.9136V20.9136ZM11.4371 19.0614C9.70752 18.8456 8.11636 18.0054 6.96289 16.6987C5.80941 15.3919 5.17312 13.7088 5.17368 11.9658C5.17368 11.4111 5.24526 10.8831 5.36158 10.3642L9.64755 14.6501V15.5449C9.64755 16.5292 10.4529 17.3345 11.4371 17.3345V19.0614V19.0614ZM17.6111 16.7887C17.4975 16.427 17.2713 16.1113 16.9654 15.8875C16.6595 15.6637 16.29 15.5436 15.911 15.5449H15.0162V12.8606C15.0162 12.3685 14.6136 11.9658 14.1214 11.9658H8.75278V10.1763H10.5423C11.0345 10.1763 11.4371 9.77362 11.4371 9.28149V7.49194H13.2267C14.2109 7.49194 15.0162 6.68665 15.0162 5.70239V5.33553C17.6379 6.40032 19.4901 8.96832 19.4901 11.9658C19.4901 13.827 18.7743 15.5181 17.6111 16.7887V16.7887Z'
        />
      </svg>
    ),
    fieldDefinitionIds: ['compass:lifecycle', 'compass:tier'],
  },
  {
    id: 'OTHER',
    label: 'Other',
    color: token('color.icon.accent.blue', colors.B300),
    icon: (props: CustomGlyphProps) => (
      <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
        <path
          fillRule='evenodd'
          clipRule='evenodd'
          d='M5 17.991c0 .007 14.005.009 14.005.009-.006 0-.005-7.991-.005-7.991C19 10.002 4.995 10 4.995 10 5.001 10 5 17.991 5 17.991ZM3 10.01C3 8.899 3.893 8 4.995 8h14.01C20.107 8 21 8.902 21 10.009v7.982c0 1.11-.893 2.009-1.995 2.009H4.995A2.004 2.004 0 0 1 3 17.991V10.01Z'
          fill='#fff'
        />
        <path
          d='M7 8.335c0-.002 2.002-.002 2.002-.002C9 8.333 9 6.665 9 6.665c0 .002-2.002.002-2.002.002C7 6.667 7 8.335 7 8.335Zm-2-1.67C5 5.745 5.898 5 6.998 5h2.004C10.106 5 11 5.749 11 6.665v1.67C11 9.255 10.102 10 9.002 10H6.998C5.894 10 5 9.251 5 8.335v-1.67Zm10 1.67c0-.002 2.002-.002 2.002-.002C17 8.333 17 6.665 17 6.665c0 .002-2.002.002-2.002.002.002 0 .002 1.668.002 1.668Zm-2-1.67C13 5.745 13.898 5 14.998 5h2.004C18.106 5 19 5.749 19 6.665v1.67c0 .92-.898 1.665-1.998 1.665h-2.004C13.894 10 13 9.251 13 8.335v-1.67Z'
          fill='#fff'
        />
      </svg>
    ),
    fieldDefinitionIds: ['compass:lifecycle'],
  },
  {
    id: 'DATASET',
    label: 'Dataset',
    color: token('color.icon.accent.magenta', '#CD519D'),
    icon: (props: CustomGlyphProps) => (
      <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
        <path
          d='M3 0H21C22.7 0 24 1.3 24 3V21C24 22.7 22.7 24 21 24H3C1.3 24 0 22.7 0 21V3C0 1.3 1.3 0 3 0Z'
          fill='#CD519D'
        />
        <path
          fillRule='evenodd'
          clipRule='evenodd'
          d='M6.5 6.5V17.5H17.5V6.5H6.5ZM6 5C5.44772 5 5 5.44772 5 6V18C5 18.5523 5.44772 19 6 19H18C18.5523 19 19 18.5523 19 18V6C19 5.44772 18.5523 5 18 5H6Z'
          fill='white'
        />
        <path fillRule='evenodd' clipRule='evenodd' d='M18 10.75H5V9.25H18V10.75Z' fill='white' />
        <path fillRule='evenodd' clipRule='evenodd' d='M18 14.75H5V13.25H18V14.75Z' fill='white' />
        <path fillRule='evenodd' clipRule='evenodd' d='M12.75 5L12.75 18L11.25 18L11.25 5L12.75 5Z' fill='white' />
      </svg>
    ),
    fieldDefinitionIds: ['compass:lifecycle'],
  },
  {
    id: 'DASHBOARD',
    label: 'Dashboard',
    color: token('color.icon.accent.purple', colors.P200),
    icon: (props: CustomGlyphProps) => (
      <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
        <path d='M0 21V3c0-1.7 1.3-3 3-3h18c1.7 0 3 1.3 3 3v18c0 1.7-1.3 3-3 3H3c-1.7 0-3-1.3-3-3Z' fill='#8270DB' />
        <path
          fillRule='evenodd'
          clipRule='evenodd'
          d='M5.5 17.5h13v-11h-13v11ZM4 18a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12Z'
          fill='#fff'
        />
        <path fillRule='evenodd' clipRule='evenodd' d='M4 9.25h8v1.5H4v-1.5ZM12 13.25h8v1.5h-8v-1.5Z' fill='#fff' />
        <path fillRule='evenodd' clipRule='evenodd' d='M12.75 6v13h-1.5V6h1.5Z' fill='#fff' />
      </svg>
    ),
    fieldDefinitionIds: ['compass:lifecycle'],
  },
  {
    id: 'DATA_PRODUCT',
    label: 'Data Product',
    color: token('color.icon.accent.green', colors.G300),
    icon: (props: CustomGlyphProps) => (
      <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
        <path d='M0 21V3c0-1.7 1.3-3 3-3h18c1.7 0 3 1.3 3 3v18c0 1.7-1.3 3-3 3H3c-1.7 0-3-1.3-3-3Z' fill='#22A06B' />
        <path
          fillRule='evenodd'
          clipRule='evenodd'
          d='M4.1 5a.9.9 0 0 1 .9-.9h4v1.8H5.9V9H4.1V5ZM19 4.1a.9.9 0 0 1 .9.9v4h-1.8V5.9H15V4.1h4ZM19.9 19a.9.9 0 0 1-.9.9h-4v-1.8h3.1V15h1.8v4ZM5 19.9a.9.9 0 0 1-.9-.9v-4h1.8v3.1H9v1.8H5Z'
          fill='#fff'
        />
        <path d='M11 8h2v2h-2V8ZM8 11h2v2H8v-2ZM11 14h2v2h-2v-2ZM14 11h2v2h-2v-2Z' fill='#fff' />
      </svg>
    ),
    fieldDefinitionIds: ['compass:lifecycle'],
  },
];

import React, { useState, useEffect } from 'react';
import find from 'lodash/find';
import { useStore } from 'providers/Store';
import actions from 'providers/Store/actions';
import QueryUrl from 'components/QueryUrl';
import GraphQLRequestPane from 'components/GraphQLRequestPane';
import HttpRequestPane from 'components/HttpRequestPane';
import ResponsePane from 'components/ResponsePane';
import Welcome from 'components/Welcome';
import {
  flattenItems,
  findItem
} from '../../utils';
import useGraphqlSchema from '../../hooks/useGraphqlSchema';

import StyledWrapper from './StyledWrapper';

const RequestTabPanel = () => {
  if(typeof window == 'undefined') {
    return <div></div>;
  }
  const [store, storeDispatch] = useStore();

  const {
    collections,
    requestTabs,
    activeRequestTabUid
  } = store;

  let asideWidth = 270;
  let {
    schema 
  } = useGraphqlSchema('https://api.spacex.land/graphql');
  const [leftPaneWidth, setLeftPaneWidth] = useState((window.innerWidth - asideWidth)/2 - 10); // 10 is for dragbar
  const [rightPaneWidth, setRightPaneWidth] = useState((window.innerWidth - asideWidth)/2);
  const [dragging, setDragging] = useState(false);
  const handleMouseMove = (e) => {
    if(dragging) {
      e.preventDefault();
      setLeftPaneWidth(e.clientX - asideWidth);
      setRightPaneWidth(window.innerWidth - (e.clientX));
    }
  };
  const handleMouseUp = (e) => {
    if(dragging) {
      e.preventDefault();
      setDragging(false);
    }
  };
  const handleDragbarMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [dragging, leftPaneWidth]);

  const onUrlChange = (value) => {
    storeDispatch({
      type: actions.REQUEST_URL_CHANGED,
      url: value,
      requestTab: focusedTab,
      collectionUid: collection ? collection.uid : null
    });
  };

  const onGraphqlQueryChange = (value) => {
    storeDispatch({
      type: actions.REQUEST_GQL_QUERY_CHANGED,
      query: value,
      requestTab: focusedTab,
      collectionUid: collection ? collection.uid : null
    });
  };

  if(!activeRequestTabUid) {
    return (
      <Welcome dispatch={storeDispatch} actions={actions}/>
    );
  }

  const focusedTab = find(requestTabs, (rt) => rt.uid === activeRequestTabUid);

  if(!focusedTab || !focusedTab.uid) {
    return (
      <div className="pb-4 px-4">An error occured!</div>
    );
  }

  let collection;
  let item;

  if(focusedTab.collectionUid) {
    collection = find(collections, (c) => c.uid === focusedTab.collectionUid);
    let flattenedItems = flattenItems(collection.items);
    item = findItem(flattenedItems, activeRequestTabUid);
  } else {
    item = focusedTab;
  }

  const runQuery = async () => {
    storeDispatch({
      type: actions.SEND_REQUEST,
      requestTab: focusedTab,
      collectionUid: collection ? collection.uid : null
    });
  };

  return (
    <StyledWrapper className="flex flex-col flex-grow">
      <div
        className="pb-4 px-4"
        style={{
          borderBottom: 'solid 1px var(--color-layout-border)'
        }}
      >
        <div className="pt-2 text-gray-600">{item.name}</div>
        <QueryUrl
          value = {item.request.url}
          onChange={onUrlChange}
          handleRun={runQuery}
          collections={collections}
        />
      </div>
      <section className="main flex flex-grow">
        <section className="request-pane">
          <div
            className="px-4"
            style={{width: `${leftPaneWidth}px`, height: 'calc(100% - 5px)'}}
          >
            {item.request.type === 'graphql' ? (
              <GraphQLRequestPane
                onRunQuery={runQuery}
                schema={schema}
                leftPaneWidth={leftPaneWidth}
                value={item.request.body.graphql.query}
                onQueryChange={onGraphqlQueryChange}
              />
            ) : null}

            {item.request.type === 'http' ? (
              <HttpRequestPane
                leftPaneWidth={leftPaneWidth}
              />
            ) : null}
          </div>
        </section>

        <div className="drag-request" onMouseDown={handleDragbarMouseDown}>
        </div>

        <section className="response-pane flex-grow">
          <ResponsePane
            rightPaneWidth={rightPaneWidth}
            response={item.response}
            isLoading={item.response && item.response.state === 'sending' ? true : false}
          />
        </section>
      </section>
    </StyledWrapper>
  )
};

export default RequestTabPanel;
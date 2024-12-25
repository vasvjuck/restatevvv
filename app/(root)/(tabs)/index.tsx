import { View, Text, Image, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native'
import React, { useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import icons from '@/constants/icons';
import Search from '@/components/Search';
import { Card, FeaturedCard } from '@/components/Cards';
import Filters from '@/components/Filters';
import { useGlobalContext } from '@/lib/global-provider';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppwrite } from '@/lib/useAppwrite';
import { getLatestProperties, getProperties } from '@/lib/appwrite';
import NoResults from '@/components/NoResults';

const Index = () => {
  const { user } = useGlobalContext();

  const params = useLocalSearchParams<{ query?: string, filter?: string }>();

  const { data: latestProperties, loading: latestPropertiesLoading } = useAppwrite({ fn: getLatestProperties });

  const { data: properties, loading, refetch } = useAppwrite({
    fn: getProperties,
    params: {
      filter: params.filter!,
      query: params.query!,
      limit: 6
    },
    skip: true,
  });

  const handleCardPress = (id: string) => router.push(`/properties/${id}`);

  useEffect(() => {
    refetch({ filter: params.filter!, query: params.query!, limit: 6 })
  }, [params.filter, params.query])


  return (
    <SafeAreaView className='bg-white h-full'>
      <FlatList
        data={properties}
        renderItem={({ item }) => <Card item={item} onPress={() => handleCardPress(item.$id)} />}
        keyExtractor={(item) => item.$id.toString()}
        numColumns={2}
        contentContainerClassName='pb-32'
        columnWrapperClassName='flex gap-5 px-5'
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={loading ? <ActivityIndicator className='text-primary-300 mt-5' size='small' /> : <NoResults />}
        ListHeaderComponent={
          <View className='px-5'>
            <View className='flex flex-row items-center justify-between mt-5'>
              <View className='flex flex-row'>
                <Image source={{ uri: user?.avatar }} className='size-12 rounded-full' />
                <View className='flex flex-col items-start ml-2 justify-center'>
                  <Text className='text-xs font-rubik text-black-100'>Good Morning</Text>
                  <Text className='text-base font-rubik-medium text-black-300'>{user?.name}</Text>
                </View>
              </View>
              <Image source={icons.bell} className='size-6' />
            </View>

            <Search />

            <View className='my-5'>
              <View className='flex flex-row items-center justify-between'>
                <Text className='text-xl font-rubik-bold text-black-300'>Featured</Text>
                <TouchableOpacity>
                  <Text className='text-base font-rubik text-primary-300'>See all</Text>
                </TouchableOpacity>
              </View>

              {latestPropertiesLoading ? (
                <ActivityIndicator size="small" className="text-primary-300" />
              ) : !latestProperties || latestProperties.length === 0 ? (
                <NoResults />
              ) : (
                <FlatList
                  keyExtractor={(item) => item.$id.toString()}
                  data={latestProperties}
                  renderItem={({ item }) => <FeaturedCard item={item} onPress={() => handleCardPress(item.$id)} />}
                  horizontal
                  bounces={false}
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName='flex gap-5 mt-5'
                />
              )}
            </View>

            <View className='flex flex-row items-center justify-between'>
              <Text className='text-xl font-rubik-bold text-black-300'>Our Recommendation</Text>
              <TouchableOpacity>
                <Text className='text-base font-rubik text-primary-300'>See all</Text>
              </TouchableOpacity>
            </View>

            <Filters />

          </View>
        }
      />
    </SafeAreaView>
  )
}

export default Index;